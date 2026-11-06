<script setup lang="ts">
import type { PageLink } from '@nuxt/ui'
import { DOCS_REPO } from '#shared/utils/docs'
import { localeLinks } from '#shared/utils/l10n'

const props = defineProps<{
  /** The English page, unprefixed. */
  path: string
  editLink: string
  /** Whether the page is served as raw Markdown, which archived versions and translations are not. */
  markdown: boolean
}>()

const toast = useToast()
const { copy } = useClipboard()
const site = useSiteConfig()
const { track } = useAnalytics()
const locale = useDocsLocale()

const mdPath = computed(() => `/raw${props.path}.md`)
const mdUrl = computed(() => `${site.url}${mdPath.value}`)

// A locale is only entered or left by a full reload, so these links are external.
const languageLinks = computed(() => [
  ...(locale.value ? [{ locale: 'en', label: 'English', to: props.path }] : []),
  ...localeLinks(props.path).filter(link => link.locale !== locale.value)
].map(link => ({
  label: link.label,
  icon: 'i-lucide-languages',
  to: link.to,
  external: true,
  hreflang: link.locale,
  onClick: () => track('Page Action', { action: 'View Translation', locale: link.locale })
})))

const links = computed<PageLink[]>(() => [
  ...languageLinks.value,
  {
    icon: 'i-simple-icons-github',
    label: 'Edit this page on GitHub',
    to: props.editLink,
    target: '_blank'
  },
  {
    icon: 'i-lucide-star',
    label: 'Star on GitHub',
    to: `https://github.com/${DOCS_REPO}`,
    target: '_blank'
  },
  ...(props.markdown
    ? [{
        icon: 'i-simple-icons-markdown',
        label: 'Open as Markdown',
        to: mdPath.value,
        target: '_blank',
        onClick: () => track('Page Action', { action: 'View as Markdown' })
      }]
    : [])
])

const prompt = computed(() => `Read ${mdUrl.value} so I can ask questions about it.`)

const items = computed(() => [
  [{
    label: 'Copy page',
    icon: 'i-lucide-copy',
    async onSelect() {
      track('Page Action', { action: 'Copy Page' })
      copy(await $fetch<string>(mdPath.value))
      toast.add({ title: 'Page copied to clipboard', icon: 'i-lucide-check-circle' })
    }
  }, {
    label: 'Copy Markdown link',
    icon: 'i-lucide-link',
    onSelect() {
      track('Page Action', { action: 'Copy Markdown Link' })
      copy(mdUrl.value)
      toast.add({ title: 'Copied to clipboard', icon: 'i-lucide-check-circle' })
    }
  }],
  [{
    label: 'Open in ChatGPT',
    icon: 'i-simple-icons:openai',
    target: '_blank',
    to: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt.value)}`,
    onSelect: () => track('Page Action', { action: 'Open in ChatGPT' })
  }, {
    label: 'Open in Claude',
    icon: 'i-simple-icons:anthropic',
    target: '_blank',
    to: `https://claude.ai/new?q=${encodeURIComponent(prompt.value)}`,
    onSelect: () => track('Page Action', { action: 'Open in Claude' })
  }]
])
</script>

<template>
  <div class="flex flex-col gap-2">
    <UPageLinks :links="links">
      <template #link-label="{ link }">
        <span :lang="link.hreflang">{{ link.label }}</span>
      </template>
    </UPageLinks>
    <UDropdownMenu
      v-if="markdown"
      v-slot="{ open }"
      :items="items"
      :content="{ align: 'start', side: 'bottom' }"
    >
      <UButton
        icon="i-lucide-message-circle"
        trailing-icon="i-lucide-chevron-down"
        label="Open in Chat"
        color="neutral"
        variant="link"
        class="self-start p-0 gap-1.5 font-normal"
        :class="open ? 'text-default' : 'text-muted'"
        :ui="{
          leadingIcon: 'size-5',
          trailingIcon: ['size-3.5 transition-transform duration-200', open && 'rotate-180']
        }"
      />
    </UDropdownMenu>
  </div>
</template>
