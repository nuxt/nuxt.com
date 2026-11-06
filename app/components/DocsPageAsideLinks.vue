<script setup lang="ts">
import type { DropdownMenuItem, PageLink } from '@nuxt/ui'
import { DOCS_REPO } from '#shared/utils/docs'
import { L10N_STRINGS, localeLinks } from '#shared/utils/l10n'

const props = defineProps<{
  /** The English page, unprefixed. */
  path: string
  editLink: string
  /** Whether the page is served as raw Markdown: only live versions in English are. */
  markdown: boolean
}>()

const { track } = useAnalytics()
const locale = useDocsLocale()

const languages = computed(() => {
  const translations = localeLinks(props.path)
  return translations.length ? [{ locale: 'en', label: 'English', to: props.path }, ...translations] : []
})

const languageLabel = computed(() => locale.value
  ? `${L10N_STRINGS[locale.value].languageLabel} ${L10N_STRINGS[locale.value].language}`
  : 'Language: English')

// A locale is only entered or left by a full reload, so these links are external.
const languageItems = computed<DropdownMenuItem[]>(() => languages.value.map(language =>
  language.locale === (locale.value ?? 'en')
    ? { label: language.label, lang: language.locale, type: 'checkbox', checked: true }
    : {
        label: language.label,
        lang: language.locale,
        to: language.to,
        external: true,
        hreflang: language.locale,
        onSelect: () => track('Page Action', { action: 'View Translation', locale: language.locale })
      }))

const links = computed<PageLink[]>(() => [
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
        to: `/raw${props.path}.md`,
        target: '_blank',
        onClick: () => track('Page Action', { action: 'View as Markdown' })
      }]
    : [])
])
</script>

<template>
  <div class="flex flex-col gap-2">
    <UDropdownMenu
      v-if="languageItems.length"
      :items="languageItems"
      :content="{ align: 'start', side: 'bottom' }"
    >
      <template #default="{ open }">
        <UButton
          icon="i-lucide-languages"
          trailing-icon="i-lucide-chevron-down"
          :label="languageLabel"
          color="neutral"
          variant="link"
          class="self-start p-0 gap-1.5 font-normal"
          :class="open ? 'text-default' : 'text-muted'"
          :ui="{
            leadingIcon: 'size-5',
            trailingIcon: ['size-3.5 transition-transform duration-200', open && 'rotate-180']
          }"
        />
      </template>
      <template #item-label="{ item }">
        <span :lang="item.lang">{{ item.label }}</span>
      </template>
    </UDropdownMenu>
    <UPageLinks :links="links" />
  </div>
</template>
