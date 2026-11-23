<script setup lang="ts">
import type { NavigationItem, SearchOptions, SearchResult } from 'comark-content'

const props = defineProps<{
  navigation?: NavigationItem[]
}>()

const { search, status, warmup } = useSearch()
const { searchGroups, searchLinks, searchTerm } = useNavigation()
const { mapSearchResults } = useContentSearch()
const { track } = useAnalytics()

// A module docs root is both the module and its `index.md` page: label the page with its own title
// (`Nuxt Fonts > Quick Start`), not the module's again (`Nuxt Fonts > Nuxt Fonts`).
const indexRoots = computed(() => new Map(props.navigation
  ?.filter(item => typeof item.indexTitle === 'string')
  .map(item => [item.path, item])))

async function searchWithIndexTitles(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
  const results = await search(query, opts)
  return results.map((result) => {
    const root = indexRoots.value.get(result.id.split('#')[0]!)
    if (!root) return result
    const indexTitle = root.indexTitle as string
    const titles = result.titles.map((title, index) => index === 0 && title === root.title ? indexTitle : title)
    // The page result only: an H1 of the page is a level-1 result too, with its own title.
    return result.id === root.path
      ? { ...result, title: indexTitle, titles, snippets: result.snippets && { ...result.snippets, title: undefined } }
      : { ...result, titles }
  })
}

const fuse = {
  resultLimit: 25
}

// The palette's search, without opening it: the first call loads the index (about 1.2 MB).
useAgentTool(defineAgentTool<{ query: string }>({
  name: 'search_docs',
  description: 'Search the Nuxt documentation, the CLI reference, the examples and the official module docs. Use when the user asks how to do something in Nuxt or looks for an API.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'Keywords or an API name, such as "useFetch" or "route middleware".' } },
    required: ['query']
  },
  annotations: { readOnlyHint: true },
  async execute({ query }) {
    await warmup()
    if (status.value !== 'ready') throw new Error('The search index could not be loaded.')
    const results = await searchWithIndexTitles(String(query), { limit: 6 })
    return results.map(result => ({
      title: result.titles.concat(result.title).join(' > '),
      path: result.id,
      excerpt: result.content.slice(0, 160)
    }))
  }
}))

// `docsResults` (capped at the palette's 25) surfaces searches the docs can't answer. It counts what
// the palette shows (results outside `navigation` are dropped there too), and is left out while the
// index loads or when the search fails, so those don't count as empty.
watchDebounced(searchTerm, async (term) => {
  if (!term) return
  const results = status.value === 'ready' ? await search(term, { limit: fuse.resultLimit }).catch(() => undefined) : undefined
  track('Search Performed', { term, docsResults: results && mapSearchResults(results, props.navigation).length })
}, { debounce: 500 })
</script>

<template>
  <UContentSearch
    v-model:search-term="searchTerm"
    :links="searchLinks"
    :groups="searchGroups"
    :navigation="navigation"
    :search="searchWithIndexTitles"
    :search-status="status"
    :loading="status === 'loading'"
    :fuse="fuse"
    :transition="false"
  />
</template>
