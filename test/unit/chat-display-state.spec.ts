import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { resolveChatDisplayState } from '../../layers/nuxi/app/composables/eve/adapter'

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
