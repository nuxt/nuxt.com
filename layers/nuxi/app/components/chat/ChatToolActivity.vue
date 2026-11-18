<script setup lang="ts">
import { getToolName, isToolUIPart, type ReasoningUIPart } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import { getToolPresentation, normalizeToolName, type ToolPart } from '../../composables/useChatTools'
import ChatToolDetails from './ChatToolDetails.vue'

const props = defineProps<{ parts: (ToolPart | ReasoningUIPart)[], active: boolean, responding?: boolean, preparing?: boolean }>()
const sourceNames: Record<string, string> = {
  search_docs: 'Nuxt docs', read_page: 'Nuxt docs', search_modules: 'Modules', show_module: 'Modules',
  show_blog_post: 'Blog', web_search: 'Web', connection_search: 'Connections', show_template: 'Templates',
  show_hosting: 'Hosting', show_nuxter: 'Nuxters', open_playground: 'Playground', show_prompt: 'Prompt', report_issue: 'Feedback'
}
const entries = computed(() => props.parts.map((part, index) => {
  if (!isToolUIPart(part)) {
    const streaming = props.active && isPartStreaming(part)
    return {
      key: 'id' in part && typeof part.id === 'string' ? part.id : `reasoning-${index}`, part, source: 'Reasoning', text: 'Reasoning',
      state: streaming ? 'running' as const : 'complete' as const, streaming,
      suffix: undefined, reasoning: part.text, error: undefined
    }
  }
  const name = normalizeToolName(getToolName(part))
  const { text, state, streaming, suffix } = getToolPresentation(part, props.active)
  return {
    key: part.toolCallId, part, reasoning: undefined,
    error: part.state === 'output-error' ? part.errorText : typeof (part.output as { error?: unknown } | undefined)?.error === 'string' ? (part.output as { error: string }).error : undefined,
    text, state, streaming, suffix,
    source: sourceNames[name] ?? (name.endsWith('module') || name.endsWith('modules') ? 'Modules' : 'Tools')
  }
}))
const expanded = ref(false)
const mounted = ref(false)
watch(expanded, (open) => {
  if (open) mounted.value = true
})
const details = computed(() => entries.value.filter(entry => entry.reasoning !== undefined ? entry.reasoning.trim() : !entry.streaming))
const current = computed(() => entries.value.findLast(entry => entry.streaming && entry.reasoning === undefined))
const reasoning = computed(() => entries.value.some(entry => entry.streaming && entry.reasoning !== undefined))
const busy = computed(() => props.active && (!props.responding || !!current.value || reasoning.value || props.preparing))
const failures = computed(() => entries.value.filter(entry => entry.state === 'error' || entry.state === 'denied').length)
const tools = computed(() => entries.value.filter(entry => isToolUIPart(entry.part)))
const summary = computed(() => {
  if (current.value) return current.value.text
  if (reasoning.value) return 'Thinking'
  if (busy.value) return tools.value.length ? 'Preparing answer' : 'Thinking'
  if (!tools.value.length) return 'Reasoning'
  if (tools.value.length === 1) return tools.value[0]!.state === 'complete' ? tools.value[0]!.source : tools.value[0]!.text
  if (failures.value === tools.value.length) return 'Sources unavailable'
  if (tools.value.every(entry => entry.state === 'stopped')) return 'Stopped'
  return [...new Set(tools.value.map(entry => entry.source))].join(' & ')
})
</script>

<template>
  <UCollapsible
    v-model:open="expanded"
    :disabled="!details.length"
    :unmount-on-hide="false"
    :ui="{ content: 'motion-reduce:animate-none' }"
    class="@container min-w-0"
    data-chat-activity
  >
    <template #default="{ open }">
      <UButton
        color="neutral"
        variant="link"
        class="group min-h-7 w-fit max-w-full gap-2 rounded-md px-0 py-0.5 text-sm font-normal text-muted hover:text-highlighted disabled:opacity-100 disabled:cursor-default"
        :aria-label="`${summary}${tools.length ? `. ${tools.length} ${tools.length === 1 ? 'action' : 'actions'}` : ''}${failures ? `, ${failures} unavailable` : ''}`"
      >
        <UChatShimmer
          :text="summary"
          class="min-h-5 truncate"
          :ui="{ base: busy ? '' : 'text-muted bg-none motion-safe:animate-none motion-safe:rtl:animate-none will-change-auto' }"
        />
        <span v-if="tools.length > 1" class="shrink-0 text-xs text-dimmed">{{ tools.length }} actions</span>
        <span v-if="failures" class="shrink-0 text-xs text-muted">{{ failures }} unavailable</span>
        <UIcon v-if="details.length" name="i-lucide-chevron-down" class="size-3 shrink-0 text-dimmed transition-transform duration-200 motion-reduce:transition-none" :class="open && 'rotate-180'" />
      </UButton>
    </template>

    <template #content>
      <div v-if="mounted" class="mt-2 max-h-72 space-y-4 overflow-y-auto overscroll-contain border-s border-default ps-4 pb-1" data-activity-details>
        <div v-for="item in details" :key="item.key" class="min-w-0">
          <UModal v-if="item.reasoning !== undefined" title="Reasoning" :ui="{ content: 'max-w-2xl h-[min(36rem,80dvh)]', body: 'min-h-0 overscroll-contain' }">
            <UButton color="neutral" variant="link" size="xs" label="Read reasoning" class="px-0 text-muted" />
            <template #body>
              <Suspense>
                <AgentComark :value="item.reasoning" :streaming="item.streaming" class="text-sm text-muted" />
                <template #fallback>
                  <USkeleton class="h-24 w-full" />
                </template>
              </Suspense>
            </template>
          </UModal>
          <template v-else>
            <div class="mb-1 flex min-w-0 items-center gap-2">
              <span class="size-1.5 shrink-0 rounded-full" :class="item.state === 'error' || item.state === 'denied' ? 'bg-error' : item.state === 'complete' ? 'bg-primary/60' : 'bg-accented'" aria-hidden="true" />
              <span class="text-xs font-medium text-default" :data-tool-call="isToolUIPart(item.part) ? item.part.toolCallId : undefined" :data-tool-state="item.state">{{ item.text }}</span>
            </div>
            <p v-if="item.suffix" class="mb-2 truncate text-xs text-dimmed" :title="item.suffix">
              {{ item.suffix }}
            </p>
            <p v-if="item.state === 'error' || item.state === 'denied'" class="mb-2 text-xs/5 text-muted">
              {{ item.error || 'No usable result from this source.' }}
            </p>
            <p v-else-if="item.state === 'stopped'" class="mb-2 text-xs/5 text-muted">
              Stopped before this lookup finished.
            </p>
            <ChatToolDetails v-if="isToolUIPart(item.part)" :part="item.part" />
          </template>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
