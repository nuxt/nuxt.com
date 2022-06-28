<template>
  <div class="m-4">
    <div class="flex my-2 gap-3">
      <UInput
        v-model="markdownURL"
        name="url"
        autocomplete="off"
        placeholder="https://raw.githubusercontent.com/nuxt/content/main/docs/content/1.index.md"
        class="w-full"
        :custom-class="markdownURLError ? 'border-red-500 dark:border-red-500': ''"
        @input="markdownURLError = false"
      />
      <UButton
        icon="heroicons-outline:download"
        type="submit"
        :loading="markdownLoading"
        @click="loadMarkdown"
      />
    </div>
    <NuxtEditor
      :components="components"
      :content="{
        key: 'playground',
        markdown,
        matter: {}
      }"
    />
  </div>
</template>

<script setup lang="ts">
import type { ComponentSchema } from '../src/module'
import { useMarkdown } from '../../../composables/useMarkdown'

useHead({
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black'
  }
})

const { parse: parseMarkdown } = useMarkdown()

const components: ComponentSchema[] = [
  {
    name: 'MyComponent',
    props: [],
    slots: [
      {
        name: 'default'
      }
    ]
  }
]

const markdown = ref('# Hello World')
const markdownLoading = ref(false)
const markdownURL = ref('')
const markdownURLError = ref(false)

async function loadMarkdown () {
  markdownURLError.value = false
  markdownLoading.value = true
  try {
    markdown.value = parseMarkdown(await $fetch(markdownURL.value)).content
  } catch (e) {
    markdownURLError.value = true
  }
  markdownLoading.value = false
}
</script>

<style>
@import 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
@import 'https://unpkg.com/prism-themes@1.9.0/themes/prism-one-dark.css';

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
