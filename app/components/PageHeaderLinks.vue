<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { copy, copied } = useClipboard()
const site = useSiteConfig()
const { track } = useAnalytics()
const isCopying = ref(false)

const mdPath = computed(() => `${site.url}/raw${route.path}.md`)

const items = [
  [{
    label: 'Copy Markdown link',
    icon: 'i-lucide-link',
    onSelect() {
      track('Page Action', { action: 'Copy Markdown Link' })
      copy(mdPath.value)
      toast.add({
        title: 'Copied to clipboard',
        icon: 'i-lucide-check-circle'
      })
    }
  },
  {
    label: 'View as Markdown',
    icon: 'i-simple-icons:markdown',
    target: '_blank',
    to: `/raw${route.path}.md`,
    onSelect: () => track('Page Action', { action: 'View as Markdown' })
  },
  {
    label: 'Open in ChatGPT',
    icon: 'i-simple-icons:openai',
    target: '_blank',
    to: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(`Read ${mdPath.value} so I can ask questions about it.`)}`,
    onSelect: () => track('Page Action', { action: 'Open in ChatGPT' })
  },
  {
    label: 'Open in Claude',
    icon: 'i-simple-icons:anthropic',
    target: '_blank',
    to: `https://claude.ai/new?q=${encodeURIComponent(`Read ${mdPath.value} so I can ask questions about it.`)}`,
    onSelect: () => track('Page Action', { action: 'Open in Claude' })
  }], [
    {
      label: 'Copy MCP URL',
      icon: 'i-lucide-link',
      onSelect() {
        track('Page Action', { action: 'Copy MCP URL' })
        copy(`https://nuxt.com/mcp`)
        toast.add({
          title: 'Copied to clipboard',
          icon: 'i-lucide-check-circle'
        })
      }
    },
    {
      label: 'Add MCP Server',
      icon: 'i-simple-icons:cursor',
      target: '_blank',
      to: `/mcp/deeplink`,
      onSelect: () => track('Page Action', { action: 'Add MCP Server' })
    }
  ]
]

async function copyPage() {
  track('Page Action', { action: 'Copy Page' })
  isCopying.value = true
  copy(await $fetch<string>(`/raw${route.path}.md`))
  isCopying.value = false
}
</script>

<template>
  <UFieldGroup>
    <UButton
      label="Copy page"
      :icon="copied ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard'"
      color="neutral"
      variant="soft"
      size="sm"
      :loading="isCopying"
      :ui="{
        leadingIcon: 'size-3.5'
      }"
      @click="copyPage"
    />
    <UDropdownMenu
      :items="items"
      size="sm"
      :content="{
        align: 'end',
        side: 'bottom',
        sideOffset: 8
      }"
      :ui="{
        content: 'w-48'
      }"
    >
      <UButton
        icon="i-lucide-chevron-down"
        size="sm"
        color="neutral"
        variant="soft"
        class="border-l border-muted"
        aria-label="Open copy options"
        :ui="{
          leadingIcon: 'size-3.5'
        }"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>
