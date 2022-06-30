<script setup lang="ts">
import type { ComponentSchema } from '../src/module'

const parsedMarkdown = ref(null)
const content = reactive({
  key: 'playground',
  matter: {},
  markdown: ''
})
const showSource = ref(false)

const { data } = await useFetch<any>('/api/markdown')
content.markdown = data.value.markdown
parsedMarkdown.value = data.value.parsedMarkdown
const { data: components } = await useFetch<ComponentSchema[]>('/api/_admin/components')

const onMarkdownUpdate = async (md) => {
  parsedMarkdown.value = await $fetch('/api/markdown', {
    method: 'POST',
    body: {
      content: md
    }
  })
  if (!showSource.value) {
    content.markdown = md
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-2">
      <div class="p-4">
        <UTextarea
          v-if="showSource"
          v-model="content.markdown"
          name="playground"
          appearance="none"
          custom-class="min-h-screen"
          @input="onMarkdownUpdate(content.markdown)"
        />
        <NuxtEditor
          v-else
          :components="components"
          :content="content"
          class="pb-10"
          @update="onMarkdownUpdate"
        />
      </div>
      <ContentRenderer class="w-full min-h-screen p-4 prose max-w-none bg-gray-50" :value="parsedMarkdown" />
      <div class="fixed bottom-0 left-0 m-4">
        <UButton variant="white" size="xs" @click="showSource = !showSource">
          {{ showSource ? 'Hide' : 'Show' }} source
        </UButton>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
@import 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
@import 'https://unpkg.com/prism-themes@1.9.0/themes/prism-one-dark.css';

body {
  @apply antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black;
}

.milkdown {
  flex: 1 1 0%;
}
.milkdown > .editor {
  max-width: 100% !important;
  padding: 0 !important;
  overflow-y: visible !important;
}

.milkdown > .editor > :first-child, .milkdown > .editor > :first-child > div {
  margin: 0 !important;
}

.ProseMirror ul {
  list-style: disc;
  padding-inline-start: 2rem;
}

.ProseMirror ol {
  list-style: decimal;
  padding-inline-start: 2rem;
}

.ProseMirror-separator {
  display: inline;
}
</style>
