import { computed, effectScope, nextTick, reactive, ref, watch, type EffectScope } from 'vue'
import type { DynamicToolUIPart } from 'ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LivePreview, LivePreviewActivity } from '../../app/composables/useLivePreview'
import type { AgentChatHandle } from '../../layers/nuxi/app/composables/eve/types'
import { useNuxiPreview } from '../../layers/nuxi/app/composables/useNuxiPreview'

let scope: EffectScope
let chat: Pick<AgentChatHandle, 'messages' | 'status'>
let preview: {
  preview: ReturnType<typeof ref<LivePreview | null>>
  activity: ReturnType<typeof ref<LivePreviewActivity | null>>
  reloadRequest: ReturnType<typeof ref<number>>
  startEditing: ReturnType<typeof vi.fn>
  navigate: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  chat = reactive({ status: 'streaming', messages: [{ id: 'reply', role: 'assistant', parts: [] }] })
  preview = {
    preview: ref({ id: 'sandbox', url: 'https://example.vercel.run', template: { slug: 'minimal', name: 'Minimal' }, error: 'Previous error' }),
    activity: ref(null), reloadRequest: ref(0), startEditing: vi.fn(), navigate: vi.fn()
  }
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useLivePreview', () => preview)
  scope = effectScope()
  scope.run(() => useNuxiPreview(chat))
})

afterEach(() => {
  scope.stop()
  vi.unstubAllGlobals()
})

function tool(name = 'edit_app_file', overrides: Partial<DynamicToolUIPart> = {}) {
  const part = {
    type: 'dynamic-tool', toolName: name, toolCallId: name, state: 'input-available',
    input: { sandboxId: 'sandbox', path: 'app/app.vue' }, ...overrides
  } as DynamicToolUIPart
  chat.messages[0]!.parts = [part]
  return nextTick()
}

async function done(name = 'edit_app_file', output: unknown = {}, input?: Record<string, unknown>) {
  await tool(name, { state: 'output-available', output, ...(input && { input }) })
}

describe('Nuxi preview updates', () => {
  it('ignores streamed text while retaining live tool activity', async () => {
    await tool()
    const activity = preview.activity.value
    chat.messages[0]!.parts.push({ type: 'text', text: 'Editing' })
    await nextTick()
    chat.messages[0]!.parts[1] = { type: 'text', text: 'Editing the home page' }
    await nextTick()
    expect(preview.startEditing).toHaveBeenCalledTimes(1)
    expect(preview.activity.value).toBe(activity)
    expect(activity).toMatchObject({ label: 'Editing app/app.vue', state: 'running' })
  })

  it('waits for settled output before reporting success', async () => {
    await tool()
    await tool('edit_app_file', { state: 'output-available', preliminary: true, output: {} })
    expect(preview.activity.value?.state).toBe('running')
    await done()
    expect(preview.activity.value?.state).toBe('done')
    expect(preview.preview.value?.error).toBeUndefined()
  })

  it('ignores tools for another sandbox and unrelated tools', async () => {
    await tool('edit_app_file', { input: { sandboxId: 'other', path: 'app.vue' } })
    await tool('search_docs')
    expect(preview.startEditing).not.toHaveBeenCalled()
    expect(preview.activity.value).toBeNull()
  })

  it('opens the route an edit affects, including deletions', async () => {
    await done('edit_app_file', {}, { sandboxId: 'sandbox', path: 'app/pages/old.vue', delete: true, previewPath: '/about' })
    expect(preview.activity.value).toMatchObject({ label: 'Deleted app/pages/old.vue', state: 'done' })
    expect(preview.navigate).toHaveBeenCalledWith('/about')
  })

  it('reloads once after a restarted app has been checked', async () => {
    await done('edit_app_file', { restarted: true })
    expect(preview.reloadRequest.value).toBe(0)
    await done('check_app_page', { status: 200 }, { sandboxId: 'sandbox', path: '/about' })
    expect(preview.preview.value?.path).toBe('/about')
    expect(preview.reloadRequest.value).toBe(1)
    chat.status = 'ready'
    await nextTick()
    expect(preview.reloadRequest.value).toBe(1)
  })

  it('handles a final tool result arriving with turn completion', async () => {
    await tool('add_app_module', { input: { sandboxId: 'sandbox', name: '@nuxt/image' } })
    const finished = done('add_app_module', { ok: true }, { sandboxId: 'sandbox', name: '@nuxt/image' })
    chat.status = 'ready'
    await finished
    expect(preview.activity.value).toMatchObject({ label: 'Installed @nuxt/image', state: 'done' })
    expect(preview.reloadRequest.value).toBe(1)
  })

  it('keeps the current route when a check uses a relative path', async () => {
    await done('edit_app_file', { restarted: true })
    await done('check_app_page', { status: 200 }, { sandboxId: 'sandbox', path: 'about' })
    expect(preview.preview.value?.path).toBeUndefined()
    expect(preview.navigate).not.toHaveBeenCalled()
    expect(preview.reloadRequest.value).toBe(1)
  })

  it.each([
    ['add_app_module', { ok: false }, { sandboxId: 'sandbox', name: '@nuxt/image' }],
    ['check_app_page', { status: 500 }, { sandboxId: 'sandbox', path: '/' }]
  ])('preserves failure state for %s', async (name, output, input) => {
    await done(name as string, output, input as Record<string, unknown>)
    expect(preview.activity.value?.state).toBe('failed')
    expect(preview.preview.value?.error).toBe('Previous error')
    expect(preview.navigate).not.toHaveBeenCalled()
    expect(preview.reloadRequest.value).toBe(0)
  })

  it('does not replay completed calls when a new turn starts', async () => {
    await done('check_app_page', { status: 200 }, { sandboxId: 'sandbox', path: '/about' })
    chat.status = 'ready'
    await nextTick()
    chat.status = 'submitted'
    await nextTick()
    expect(preview.navigate).toHaveBeenCalledTimes(1)
  })

  it('drops pending reloads when another preview replaces this one', async () => {
    await done('edit_app_file', { restarted: true })
    preview.preview.value = { ...preview.preview.value!, id: 'new-sandbox' }
    chat.status = 'ready'
    await nextTick()
    expect(preview.reloadRequest.value).toBe(0)
  })
})
