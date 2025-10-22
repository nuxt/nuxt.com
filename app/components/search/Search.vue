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

const { searchLinks, searchTerm } = useNavigation()

const groups = computed(() => [{
  id: 'ai',
  label: 'Assistant',
  ignoreFilter: true,
  items: [{
    label: 'Ask Nuxt AI',
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
  }]
}])

function onClose() {
  chat.value = false
  fullscreen.value = false
}
</script>

<template>
  <UContentSearch
    v-model:search-term="searchTerm"
    :links="searchLinks"
    :files="files"
    :groups="groups"
    :navigation="navigation"
    :fullscreen="fullscreen"
    :fuse="{ resultLimit: 115 }"
  >
    <template v-if="chat" #content>
      <SearchChat v-model:messages="messages" v-model:fullscreen="fullscreen" @close="onClose" />
    </template>
  </UContentSearch>
</template>
