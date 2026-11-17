import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { AgentChatStatus } from '../../layers/nuxi/app/composables/eve/types'
import { useChatQueue, type ChatQueueItem } from '../../layers/nuxi/app/composables/useChatQueue'
import type { TextPasteAttachment } from '../../layers/nuxi/shared/utils/paste-attachment'

const snippet: TextPasteAttachment = { name: 'app.vue', content: '<template />' }

const flush = () => new Promise(resolve => setTimeout(resolve))

function setup(initial: AgentChatStatus = 'streaming') {
  const status = ref<AgentChatStatus>(initial)
  const canSend = ref(true)
  const input = ref('')
  const attachments = ref<TextPasteAttachment[]>([])
  const sent: ChatQueueItem[] = []
  // Set to make each send wait, like a logged-in send that saves the message before the chat gets it.
  let saving: Promise<void> | undefined
  const chat = effectScope().run(() => useChatQueue({
    status: () => status.value,
    canSend: () => canSend.value,
    send: (item) => {
      sent.push(item)
      return saving
    },
    input,
    attachments
  }))!
  // What `UChatPrompt` does on submit during an answer: it adds the text and clears the textarea.
  const submit = async (text: string) => {
    chat.queue.value = [...chat.queue.value, { text }]
    input.value = ''
    await nextTick()
  }
  const setStatus = async (value: AgentChatStatus) => {
    status.value = value
    await nextTick()
    await flush()
  }
  // What `UChatPrompt` does on "send now": it moves the picked message to the front, then emits `send`.
  const sendNow = async (index: number) => {
    const item = chat.queue.value[index]!
    chat.queue.value = [item, ...chat.queue.value.filter((_, i) => i !== index)]
    chat.onSend()
    await flush()
  }
  const holdSends = () => {
    let release!: () => void
    saving = new Promise(resolve => release = resolve)
    return async () => {
      saving = undefined
      release()
      await flush()
    }
  }
  const texts = () => sent.map(item => item.text)
  return { ...chat, status, canSend, input, attachments, sent, texts, submit, setStatus, sendNow, holdSends }
}

describe('chat queue', () => {
  it('sends queued messages one at a time, each once the answer before it ends', async () => {
    const chat = setup()
    await chat.submit('first')
    await chat.submit('second')
    expect(chat.sent).toEqual([])

    await chat.setStatus('ready')
    expect(chat.texts()).toEqual(['first'])
    expect(chat.queue.value.map(item => item.text)).toEqual(['second'])

    // Sending starts the next answer: nothing else goes until it ends.
    await chat.setStatus('submitted')
    await chat.setStatus('streaming')
    expect(chat.sent).toHaveLength(1)
    await chat.setStatus('ready')
    expect(chat.texts()).toEqual(['first', 'second'])
    expect(chat.queue.value).toEqual([])
  })

  it('waits after an error, and at the daily limit', async () => {
    const chat = setup()
    await chat.submit('after the error')
    await chat.setStatus('error')
    await chat.sendNow(0)
    expect(chat.sent).toEqual([])

    chat.canSend.value = false
    await chat.setStatus('ready')
    await chat.sendNow(0)
    expect(chat.sent).toEqual([])
    expect(chat.queue.value).toHaveLength(1)
  })

  it('sends a message now during an answer, to steer it, and keeps the rest queued', async () => {
    const chat = setup()
    await chat.submit('later')
    await chat.submit('now')
    await chat.sendNow(1)
    // Sent while the chat is still answering: no waiting for the answer to end.
    expect(chat.texts()).toEqual(['now'])
    expect(chat.queue.value.map(item => item.text)).toEqual(['later'])

    await chat.setStatus('ready')
    expect(chat.texts()).toEqual(['now', 'later'])
  })

  it('sends in the order picked while earlier messages are still being saved', async () => {
    const chat = setup()
    await chat.submit('a')
    await chat.submit('b')
    await chat.submit('c')
    const release = chat.holdSends()

    await chat.sendNow(2)
    await chat.sendNow(0)
    // "c" is still saving: "a" waits for it, so the chat gets them in the order they were picked.
    expect(chat.texts()).toEqual(['c'])
    expect(chat.queue.value.map(item => item.text)).toEqual(['b'])

    await release()
    expect(chat.texts()).toEqual(['c', 'a'])
    // The answer ending during the save doesn't send "b" too early, nor lose it.
    expect(chat.queue.value.map(item => item.text)).toEqual(['b'])
    await chat.setStatus('ready')
    expect(chat.texts()).toEqual(['c', 'a', 'b'])
  })

  it('sends the next message when the answer ends before the last send settles', async () => {
    const chat = setup()
    await chat.submit('first')
    await chat.submit('second')
    const release = chat.holdSends()
    await chat.sendNow(0)

    await chat.setStatus('ready')
    expect(chat.texts()).toEqual(['first'])
    await release()
    expect(chat.texts()).toEqual(['first', 'second'])
  })

  it('keeps pasted attachments with the message they were queued with', async () => {
    const chat = setup()
    chat.attachments.value = [snippet]
    await chat.submit('with code')
    await chat.submit('without code')
    expect(chat.attachments.value).toEqual([])
    expect(chat.queue.value.map(item => item.attachments)).toEqual([[snippet], []])

    chat.input.value = 'with code, and more'
    await chat.setStatus('ready')
    expect(chat.sent[0]).toMatchObject({ text: 'with code', attachments: [snippet] })
    // Sent, not edited: even if the prompt happens to hold its text, the attachment doesn't come back.
    expect(chat.attachments.value).toEqual([])
  })

  it('gives attachments back when a message is edited, not when it is removed', async () => {
    const chat = setup()
    chat.attachments.value = [snippet]
    await chat.submit('edit me')
    chat.attachments.value = [snippet]
    await chat.submit('remove me')

    // Edit: `UChatPrompt` takes it out of the queue and puts its text in the prompt.
    chat.queue.value = chat.queue.value.slice(1)
    chat.input.value = 'edit me'
    await nextTick()
    expect(chat.attachments.value).toEqual([snippet])

    // Remove, while the draft happens to hold its text: the attachment doesn't come back.
    chat.attachments.value = []
    chat.input.value = 'remove me, and more'
    await nextTick()
    chat.queue.value = []
    await nextTick()
    expect(chat.attachments.value).toEqual([])
  })
})
