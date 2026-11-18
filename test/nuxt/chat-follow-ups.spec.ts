import { expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ChatPage from '../../layers/nuxi/app/pages/dashboard/chat/[id].vue'

const { askQuestion } = vi.hoisted(() => ({ askQuestion: vi.fn() }))

vi.mock('../../layers/nuxi/app/composables/useNuxiChat', async () => {
  const { ref } = await import('vue')
  return {
    setupStaleChatRefresh: () => {},
    useNuxiChat: () => ({
      chat: { messages: [], status: 'ready' },
      input: ref(''),
      prompt: ref({ canSubmit: true, pasteAttachments: [] }),
      getVote: () => null,
      vote: vi.fn(),
      askQuestion,
      onSubmit: vi.fn(),
      handlePaste: vi.fn(),
      removeAttachment: vi.fn()
    })
  }
})

vi.mock('../../layers/nuxi/app/composables/useChatDetail', async () => {
  const { ref } = await import('vue')
  return {
    resolveChatRouteId: () => 'follow-up-chat',
    useChatRouteId: () => ref('follow-up-chat'),
    useChatDetail: () => ({
      data: ref({ isOwner: true, title: 'Follow-up chat', messages: [] }),
      error: ref(null),
      status: ref('success'),
      refresh: async () => {}
    })
  }
})

mockNuxtImport('useUserSession', () => () => ({ loggedIn: ref(true) }))
mockNuxtImport('useNuxtAgent', () => () => ({ usage: ref(), rateLimitReached: ref(false) }))
mockNuxtImport('useChats', () => () => ({ refresh: vi.fn() }))
mockNuxtImport('useNuxiChatSeo', () => () => {})

it('sends a follow-up from the full chat page through its chat handler', async () => {
  const wrapper = await mountSuspended(ChatPage, {
    global: {
      stubs: {
        UDashboardPanel: { template: '<main><slot name="body" /></main>' },
        AgentChatBody: { emits: ['askQuestion'], template: '<button @click="$emit(\'askQuestion\', \'How can I debug hydration?\')">Follow up</button>' }
      }
    }
  })
  try {
    await wrapper.get('button').trigger('click')
    expect(askQuestion).toHaveBeenCalledExactlyOnceWith('How can I debug hydration?')
  } finally {
    wrapper.unmount()
  }
})
