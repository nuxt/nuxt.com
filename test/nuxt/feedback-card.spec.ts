import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createError, readBody } from 'h3'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { UApp } from '#components'
import AgentChatMessages from '../../layers/nuxi/app/components/agent/AgentChatMessages.vue'

describe('report_issue feedback card', () => {
  it('reports the issue with the chat it was shown in', async () => {
    const bodies: Record<string, unknown>[] = []
    registerEndpoint('/api/agent/feedback', {
      method: 'POST',
      handler: async (event) => {
        const body = await readBody(event)
        bodies.push(body)
        // Like the real endpoint: without a chat id, the request is rejected.
        if (!body?.chatId) throw createError({ statusCode: 400 })
        return { url: 'https://linear.app/nuxt/issue/NUXT-1' }
      }
    })

    const chat = {
      status: 'ready',
      messages: [
        { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Why is this template broken?' }] },
        { id: 'a1', role: 'assistant', parts: [
          { type: 'tool-report_issue', toolCallId: 't1', state: 'output-available', input: {}, output: { title: 'Template fails', summary: 'Could not find why.' } },
          { type: 'text', text: 'Filed.' }
        ] }
      ]
    }
    const wrapper = await mountSuspended(defineComponent(() => () => h(UApp, null, {
      default: () => h(AgentChatMessages, { chat: chat as never, chatId: 'chat-123', getVote: () => null, showActions: false })
    })))

    await wrapper.findAll('button').find(button => button.text() === 'Report issue')!.trigger('click')
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(bodies).toEqual([{ chatId: 'chat-123', title: 'Template fails', summary: 'Could not find why.' }])
    expect(wrapper.text()).toContain('Feedback sent')
  })
})
