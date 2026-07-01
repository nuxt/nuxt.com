<script setup lang="ts">
import {
  buildClaudeCodeBrowserUrl,
  buildCursorBrowserUrl
} from '../../../layers/nuxi/shared/utils/ide-deeplinks'

const props = defineProps<{
  description: string
  prompt: string
  repo?: string
  icon?: string
  deeplinks: {
    cursor: string
    claude: string
  }
}>()

const { copied } = useClipboard()
const toast = useToast()
const { track } = useAnalytics()
const expanded = ref(false)

const previewLimit = 200
const isLong = computed(() => props.prompt.length > previewLimit)
const previewText = computed(() => {
  if (expanded.value || !isLong.value) return props.prompt
  return `${props.prompt.slice(0, previewLimit)}…`
})

const pasteShortcut = computed(() =>
  typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'
)

function openIdeDeeplink(url: string) {
  window.location.assign(url)
}

async function copyPromptToClipboard(options: { title: string, description: string, icon: string }) {
  try {
    await navigator.clipboard.writeText(props.prompt)
    toast.add(options)
  } catch {
    // Clipboard can fail without blocking the deeplink handoff.
  }
}

async function openInCursor() {
  track('Nuxi Prompt Opened', { ide: 'cursor', source: 'nuxt-agent' })

  const { url, needsClipboardFallback } = buildCursorBrowserUrl(props.prompt)
  if (needsClipboardFallback) {
    await copyPromptToClipboard({
      title: 'Prompt copied',
      description: `Paste with ${pasteShortcut.value} when your IDE opens`,
      icon: 'i-lucide-clipboard-check'
    })
  }

  openIdeDeeplink(url)
}

async function openInClaudeCode() {
  track('Nuxi Prompt Opened', { ide: 'claude', source: 'nuxt-agent' })

  const { url, needsClipboardFallback } = buildClaudeCodeBrowserUrl(props.prompt, props.repo)

  if (needsClipboardFallback) {
    await copyPromptToClipboard({
      title: 'Prompt copied',
      description: `Paste with ${pasteShortcut.value} when your IDE opens`,
      icon: 'i-lucide-clipboard-check'
    })
  }

  openIdeDeeplink(url)
}

function copyPrompt() {
  track('Nuxi Prompt Copied', { source: 'nuxt-agent' })
  void copyPromptToClipboard({
    title: 'Prompt copied!',
    description: props.description,
    icon: 'i-lucide-clipboard-check'
  })
}
</script>

<template>
  <div class="rounded-lg border border-default bg-elevated/50 overflow-hidden">
    <div class="flex items-center gap-2 px-3 py-2 border-b border-default/80">
      <UIcon
        :name="icon ?? 'i-lucide-sparkles'"
        class="size-3.5 text-primary shrink-0"
      />
      <span class="text-sm font-medium text-highlighted leading-snug">{{ description }}</span>
    </div>

    <div class="px-3 py-2">
      <p
        class="text-[11px] leading-relaxed text-muted font-mono whitespace-pre-wrap"
        :class="expanded || !isLong ? '' : 'line-clamp-4'"
      >
        {{ previewText }}
      </p>
      <button
        v-if="isLong"
        type="button"
        class="mt-1 text-[11px] text-dimmed hover:text-default transition-colors"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Show less' : 'Show full prompt' }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-default/80">
      <UTooltip
        arrow
        :delay-duration="700"
        :content="{ side: 'top', sideOffset: 6 }"
        text="Open prompt in Cursor"
      >
        <span class="inline-flex">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-cursor"
            label="Open in Cursor"
            @click="openInCursor"
          />
        </span>
      </UTooltip>

      <UTooltip
        arrow
        :delay-duration="700"
        :content="{ side: 'top', sideOffset: 6 }"
        text="Prefill prompt in Claude Code"
      >
        <span class="inline-flex">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            label="Open in Claude Code"
            @click="openInClaudeCode"
          >
            <template #leading>
              <UIcon name="i-simple-icons-anthropic" class="size-3.5 text-[#D97757]" />
            </template>
          </UButton>
        </span>
      </UTooltip>

      <UTooltip
        arrow
        :delay-duration="700"
        :content="{ side: 'top', sideOffset: 6 }"
        text="Copy prompt"
        class="ml-auto"
      >
        <span class="inline-flex">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="copied ? 'Copied' : 'Copy'"
            @click="copyPrompt"
          />
        </span>
      </UTooltip>
    </div>
  </div>
</template>
