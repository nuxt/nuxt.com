import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { AgentChatStatus } from '../../layers/nuxi/app/composables/eve/types'
import { useChatQueue, type ChatQueueItem } from '../../layers/nuxi/app/composables/useChatQueue'
import type { TextPasteAttachment } from '../../layers/nuxi/shared/utils/paste-attachment'

const snippet: TextPasteAttachment = { name: 'app.vue', content: '<template />' }

function setup(initial: AgentChatStatus = 'streaming') {
  const status = ref<AgentChatStatus>(initial)
  const canSend = ref(true)
  const input = ref('')
  const attachments = ref<TextPasteAttachment[]>([])
  const sent: ChatQueueItem[] = []
  const stop = vi.fn()
  // Set to make each send wait, like a logged-in send that saves the message before the chat answers.
  let saving: Promise<void> | undefined
  const chat = effectScope().run(() => useChatQueue({
    status: () => status.value,
    canSend: () => canSend.value,
    send: (item) => {
      sent.push(item)
      return saving
    },
    stop,
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
  }
  const holdSends = () => {
    let release!: () => void
    saving = new Promise(resolve => release = resolve)
    return async () => {
      saving = undefined
      release()
      await new Promise(resolve => setTimeout(resolve))
    }
  }
  return { ...chat, status, canSend, input, attachments, sent, stop, submit, setStatus, holdSends }
}

describe('chat queue', () => {
  it('sends queued messages one at a time, each once the answer before it ends', async () => {
    const chat = setup()
    await chat.submit('first')
    await chat.submit('second')
    expect(chat.sent).toEqual([])

    await chat.setStatus('ready')
    expect(chat.sent.map(item => item.text)).toEqual(['first'])
    expect(chat.queue.value.map(item => item.text)).toEqual(['second'])

    // Sending starts the next answer: nothing else goes until it ends.
    await chat.setStatus('submitted')
    await chat.setStatus('streaming')
    expect(chat.sent).toHaveLength(1)
    await chat.setStatus('ready')
    expect(chat.sent.map(item => item.text)).toEqual(['first', 'second'])
    expect(chat.queue.value).toEqual([])
  })

  it('waits after an error, and at the daily limit', async () => {
    const chat = setup()
    await chat.submit('after the error')
    await chat.setStatus('error')
    chat.onSend()
    expect(chat.sent).toEqual([])

    chat.canSend.value = false
    await chat.setStatus('ready')
    expect(chat.sent).toEqual([])
    expect(chat.queue.value).toHaveLength(1)
  })

  it('sends a message now by stopping the answer, once', async () => {
    const chat = setup()
    await chat.submit('later')
    await chat.submit('now')
    // `UChatPrompt` moves the picked message to the front, then emits `send`.
    chat.queue.value = [chat.queue.value[1]!, chat.queue.value[0]!]
    chat.onSend()
    expect(chat.stop).toHaveBeenCalledOnce()
    expect(chat.sent).toEqual([])

    await chat.setStatus('ready')
    expect(chat.sent.map(item => item.text)).toEqual(['now'])
    expect(chat.queue.value.map(item => item.text)).toEqual(['later'])

    // With no answer running, "send now" sends right away.
    await chat.setStatus('submitted')
    await chat.setStatus('ready')
    expect(chat.sent).toHaveLength(2)
    chat.onSend()
    expect(chat.sent).toHaveLength(2)
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

  it('sends nothing else while a message is still being saved', async () => {
    const chat = setup('ready')
    await chat.submit('first')
    await chat.submit('second')
    const release = chat.holdSends()

    chat.onSend()
    expect(chat.sent.map(item => item.text)).toEqual(['first'])
    // The chat is still `ready` while the first message saves: "send now" must not send the second one too.
    chat.onSend()
    expect(chat.sent).toHaveLength(1)
    expect(chat.stop).not.toHaveBeenCalled()

    // Saved: the chat answers, and the second one goes once that answer ends.
    await release()
    expect(chat.sent).toHaveLength(1)
    await chat.setStatus('streaming')
    await chat.setStatus('ready')
    expect(chat.sent.map(item => item.text)).toEqual(['first', 'second'])
  })

  it('sends the next message when the answer ends before its send settles', async () => {
    const chat = setup('ready')
    await chat.submit('first')
    await chat.submit('second')
    const release = chat.holdSends()
    chat.onSend()

    await chat.setStatus('streaming')
    await chat.setStatus('ready')
    expect(chat.sent).toHaveLength(1)
    await release()
    expect(chat.sent.map(item => item.text)).toEqual(['first', 'second'])
  })
})
