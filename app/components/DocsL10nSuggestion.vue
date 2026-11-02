<script setup lang="ts">
import { L10N_PREFERENCE_COOKIE, L10N_STRINGS, localisePath, type L10nLocale } from '#shared/utils/l10n'

const props = defineProps<{
  /** The English page, which has a localised twin. */
  path: string
  /** Locales that may be suggested: those with reviewed, indexable pages. */
  locales: L10nLocale[]
}>()

const preference = useCookie(L10N_PREFERENCE_COOKIE)
const dismissed = useLocalStorage<string[]>('docs-l10n-dismissed', [])

const locale = computed<L10nLocale | undefined>(() => {
  if (import.meta.server || preference.value) return
  const languages = navigator.languages ?? [navigator.language]
  return props.locales.find(code => languages.some(language => language.toLowerCase().split('-')[0] === code) && !dismissed.value.includes(code))
})

function dismiss(code: L10nLocale) {
  dismissed.value = [...dismissed.value, code]
}
</script>

<template>
  <ClientOnly>
    <UAlert
      v-if="locale"
      :lang="locale"
      color="neutral"
      variant="subtle"
      icon="i-lucide-languages"
      class="mt-4"
      :title="L10N_STRINGS[locale].suggestion"
      :actions="[{ label: L10N_STRINGS[locale].suggestionLink, to: localisePath(locale, props.path), external: true, color: 'neutral', variant: 'outline' }]"
      close
      @update:open="dismiss(locale)"
    />
  </ClientOnly>
</template>
