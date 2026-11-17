<script setup lang="ts">
import { getToolName } from 'ai'
import { getToolReferences, type ToolPart } from '../../composables/useChatTools'

const props = defineProps<{ part: ToolPart }>()
const open = ref(false)
const selected = ref(0)
const references = computed(() => getToolReferences(props.part))
const reference = computed(() => references.value[selected.value])
const payload = computed(() => JSON.stringify({
  tool: getToolName(props.part),
  input: props.part.input,
  ...('errorText' in props.part && { error: props.part.errorText }),
  ...('output' in props.part && { output: props.part.output })
}, null, 2))

function inspect(index: number) {
  selected.value = index
  open.value = true
}
</script>

<template>
  <div v-if="references.length" class="grid gap-x-3 gap-y-0.5 @md:grid-cols-2" data-tool-references>
    <UButton
      v-for="(item, index) in references"
      :key="`${item.url}-${index}`"
      color="neutral"
      variant="ghost"
      class="group w-full min-w-0 justify-start gap-2.5 px-2 py-1.5 text-left font-normal"
      :title="[item.title, item.section].filter(Boolean).join(' › ')"
      :aria-label="`Read ${item.title}${item.section ? `: ${item.section}` : ''}`"
      @click="inspect(index)"
    >
      <span class="min-w-0 flex-1 truncate text-xs text-default">{{ item.section?.split(' › ').at(-1) || item.title }}</span>
      <span v-if="item.section && item.section !== item.title" class="max-w-1/3 truncate text-[11px] text-dimmed" :title="item.title">{{ item.title }}</span>
      <UIcon name="i-lucide-arrow-up-right" class="size-3 shrink-0 text-dimmed group-hover:text-primary" />
    </UButton>
  </div>
  <UButton
    color="neutral"
    variant="link"
    size="xs"
    class="mt-1 px-2 py-1 font-normal text-dimmed"
    label="Request & response"
    @click="inspect(-1)"
  />

  <UModal
    v-model:open="open"
    :title="reference?.title || 'Request & response'"
    :description="reference ? reference.section || 'Source used for this answer' : getToolName(part)"
    :ui="{
      content: 'max-w-2xl h-[min(38rem,85dvh)] motion-reduce:animate-none',
      header: 'shrink-0 pe-12',
      body: 'min-h-0 overflow-hidden p-0 sm:p-0',
      footer: 'shrink-0 justify-between',
      overlay: 'motion-reduce:animate-none'
    }"
  >
    <template #body>
      <div :key="selected" class="h-full overflow-y-auto overscroll-contain p-4 sm:p-6" data-source-detail>
        <Suspense v-if="reference?.content">
          <AgentComark :value="reference.content" class="text-sm/6 text-muted" />
          <template #fallback>
            <div class="space-y-3" role="status" aria-label="Loading source">
              <USkeleton class="h-5 w-2/3" />
              <USkeleton v-for="line in 4" :key="line" class="h-4 w-full" />
            </div>
          </template>
        </Suspense>
        <p v-else-if="reference" class="text-sm text-muted">
          No excerpt was returned. Open the original page to read more.
        </p>
        <pre v-else class="whitespace-pre-wrap break-all text-xs/5 text-muted" v-text="payload" />
      </div>
    </template>
    <template v-if="reference" #footer>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          aria-label="Previous source"
          :disabled="selected === 0"
          @click="selected--"
        />
        <span class="text-xs tabular-nums text-muted">{{ selected + 1 }} / {{ references.length }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          aria-label="Next source"
          :disabled="selected === references.length - 1"
          @click="selected++"
        />
      </div>
      <UButton
        :to="reference.url"
        target="_blank"
        rel="noopener noreferrer"
        label="Open page"
        trailing-icon="i-lucide-arrow-up-right"
        color="neutral"
        variant="outline"
        size="sm"
      />
    </template>
  </UModal>
</template>
