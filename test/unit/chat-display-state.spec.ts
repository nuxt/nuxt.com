import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { isBetweenSteps, resolveChatDisplayState } from '../../layers/nuxi/app/composables/eve/adapter'

const user: UIMessage = { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'How do I add auth?' }] }

function assistant(parts: UIMessage['parts']): UIMessage {
  return { id: 'a1', role: 'assistant', parts }
}

describe('resolveChatDisplayState', () => {
  it('keeps the indicator when streaming starts before the assistant message exists', () => {
    const state = resolveChatDisplayState([user], 'streaming')

    expect(state.displayStatus).toBe('submitted')
    expect(state.displayMessages).toEqual([user])
  })

  it('keeps the indicator while the assistant only has an empty reasoning part', () => {
    const state = resolveChatDisplayState([user, assistant([{ type: 'step-start' }, { type: 'reasoning', text: '' }])], 'streaming')

    expect(state.displayStatus).toBe('submitted')
    expect(state.displayMessages).toEqual([user])
  })

  it('streams once the assistant has visible content', () => {
    const reply = assistant([{ type: 'text', text: 'Use nuxt-auth-utils.' }])
    const state = resolveChatDisplayState([user, reply], 'streaming')

    expect(state.displayStatus).toBe('streaming')
    expect(state.displayMessages).toEqual([user, reply])
  })
})

describe('isBetweenSteps', () => {
  const searched = { type: 'dynamic-tool', toolName: 'search_docs', toolCallId: 't1', state: 'output-available', input: {}, output: {} } as const

  it('is true once the tool result is back and the next step has not streamed yet', () => {
    const reply = assistant([{ type: 'reasoning', text: 'Check the docs.', state: 'done' }, searched])
    expect(isBetweenSteps([user, reply], 'streaming')).toBe(true)
  })

  it('is false while a part is still streaming or a tool is running', () => {
    expect(isBetweenSteps([user, assistant([{ type: 'text', text: 'Use', state: 'streaming' }])], 'streaming')).toBe(false)
    expect(isBetweenSteps([user, assistant([{ ...searched, state: 'input-available', output: undefined }])], 'streaming')).toBe(false)
  })

  it('is false while a tool waits for approval, and once the turn is over', () => {
    expect(isBetweenSteps([user, assistant([{ ...searched, state: 'approval-requested', output: undefined, approval: { id: 'a' } }])], 'streaming')).toBe(false)
    expect(isBetweenSteps([user, assistant([searched])], 'ready')).toBe(false)
  })

  it('leaves the empty-reply case to the main indicator', () => {
    expect(isBetweenSteps([user, assistant([{ type: 'reasoning', text: '', state: 'done' }])], 'streaming')).toBe(false)
  })
})
