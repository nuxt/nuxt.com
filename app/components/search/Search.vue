<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { ContentNavigationItem } from '@nuxt/content'

interface ContentSearchFile {
  id: string
  title: string
  titles: string[]
  level: number
  content: string
}

defineProps<{
  files?: ContentSearchFile[]
  navigation?: ContentNavigationItem[]
}>()

const chat = ref(false)
const fullscreen = ref(false)
const messages = ref<UIMessage[]>([])

const { searchLinks, searchGroups, searchTerm } = useNavigation()

const links = computed(() => [{
  label: 'Ask Nuxt AI',
  description: 'Ask the assistant about anything Nuxt related.',
  icon: 'i-simple-icons-nuxtdotjs',
  ui: {
    itemLeadingIcon: 'group-data-highlighted:not-group-data-disabled:text-primary'
  },
  onSelect: (e: any) => {
    e.preventDefault()

    messages.value = searchTerm.value
      ? [{
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: searchTerm.value }]
        }]
      : []

    chat.value = true
  }
},
...searchLinks.value
])

function onClose() {
  chat.value = false
  fullscreen.value = false
}
</script>

<template>
  <UContentSearch
    v-model:search-term="searchTerm"
    :links="links"
    :files="files"
    :groups="searchGroups"
    :navigation="navigation"
    :fullscreen="fullscreen"
    :fuse="{
      resultLimit: 42,
      fuseOptions: {
        threshold: 0
      }
    }"
  >
    <template v-if="chat" #content>
      <SearchChat v-model:messages="messages" v-model:fullscreen="fullscreen" @close="onClose" />
    </template>
  </UContentSearch>
</template>
