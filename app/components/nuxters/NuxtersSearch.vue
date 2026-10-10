<script setup lang="ts">
import type { InputMenuItem } from '@nuxt/ui'
import type { NuxterSummary, NuxtersPeriod } from '#shared/types'

const props = defineProps<{
  /** Search the rank of this period, and open the profile on it. */
  period: NuxtersPeriod
}>()

const { format } = new Intl.NumberFormat('en-US')

const searchTerm = ref('')
const results = ref<NuxterSummary[]>([])
const loading = ref(false)

// Lazy: nothing is loaded until the user types, then one request per pause in typing.
let request = 0
watchDebounced([searchTerm, () => props.period], async ([term]) => {
  const query = term.trim()
  const current = ++request
  if (!query) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const items = await $fetch<NuxterSummary[]>('/api/search/nuxters', { query: { q: query, period: props.period } })
    // A slower, older request must not replace newer results.
    if (current === request) results.value = items
  } finally {
    if (current === request) loading.value = false
  }
}, { debounce: 200 })

const items = computed<InputMenuItem[]>(() => results.value.map(nuxter => ({
  label: nuxter.username,
  description: `#${format(nuxter.rank)} · ${format(nuxter.score)} pts`,
  // UAvatar renders with <NuxtImg> (IPX): pass the source path, not an IPX URL.
  avatar: {
    src: `/gh_avatar/${nuxter.username}`,
    alt: nuxter.username,
    densities: 'x1 x2'
  },
  onSelect: () => open(nuxter.username)
})))

function open(username: string) {
  searchTerm.value = ''
  results.value = []
  navigateTo({ path: `/nuxters/${username}`, query: props.period === 'all' ? {} : { period: props.period } })
}
</script>

<template>
  <UInputMenu
    v-model:search-term="searchTerm"
    :items="items"
    ignore-filter
    :loading="loading"
    icon="i-lucide-search"
    placeholder="Search a Nuxter"
    aria-label="Search a Nuxter"
    :reset-search-term-on-blur="false"
    :trailing-icon="false"
    :ui="{ base: 'text-base/5 sm:text-sm/5', itemLeadingAvatar: 'rounded-md' }"
    class="w-full sm:w-56"
  >
    <template #empty>
      {{ searchTerm.trim() && !loading ? 'No Nuxter found' : 'Type a GitHub username' }}
    </template>
  </UInputMenu>
</template>
