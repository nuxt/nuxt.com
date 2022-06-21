<template>
  <div>
    <ProjectContentFileEditor
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
</script>
