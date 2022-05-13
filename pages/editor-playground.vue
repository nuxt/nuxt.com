<template>
  <div class="m-4">
    <ProjectContentFileEditor
      :content="content"
      class="flex flex-col flex-1"
      @update="onMarkdownUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { Content } from '~/editor/types'

definePageMeta({ layout: false })

const content: Content = {
  key: 'my-file',
  markdown: [
    '::my-component',
    '---',
    'fmArray:',
    '- name: foo',
    '  value: bar',
    '---',
    '::'
  ].join('\n'),
  matter: {}
}

const onMarkdownUpdate = (markdown: string) => {
  console.log('onMarkdownUpdate', {
    from: content.markdown,
    to: markdown
  })
  content.markdown = markdown
}
</script>
