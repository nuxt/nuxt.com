<template>
  <div>
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
    <ProjectContentFileEditor
      class="mt-4"
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
import type { ComponentSchema } from '~/editor/types'

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
