<template>
  <div class="m-4">
    <NuxtEditor
      :components="components"
      :content="content"
    />
  </div>
</template>

<script setup lang="ts">
import type { ComponentSchema } from '../modules/editor/src/module'

definePageMeta({
  layout: false
})

useHead({
  bodyAttrs: {
    class: 'antialiased font-sans text-gray-700 dark:text-gray-200 bg-white dark:bg-black'
  }
})

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

const content = reactive({
  key: 'playground',
  matter: {},
  markdown: '# Hello World !'
})
</script>

<style>
@import 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
@import 'https://unpkg.com/prism-themes@1.9.0/themes/prism-one-dark.css';
</style>
