<script lang="ts">
import { defineComponent, defineAsyncComponent, computed, useAttrs } from 'vue'
import type { UnwrapOptions } from '~/editor/types'

export default defineComponent({
  components: {
    VueEditor: defineAsyncComponent(async () => {
      const { VueEditor } = await import('@milkdown/vue')
      return VueEditor
    })
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    components: {
      type: Array as () => UnwrapOptions['components'],
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  async setup (props, { emit }) {
    const attrs = useAttrs()

    if (process.server) {
      return { editor: null }
    }

    // Workaround cause a dynamic imported dependency checks `process.env`
    if (typeof process !== 'undefined' && !process.env) {
      process.env = {}
    }

    const { useEditor } = await import('~/editor/use')

    const editor = useEditor({
      components: computed(() => [...props.components]),
      content: computed(() => props.modelValue),
      onChanged: (content: string) => (content !== props.modelValue) && emit('update:modelValue', content)
    })

    return {
      attrs,
      editor
    }
  }
})
</script>

<template>
  <ClientOnly>
    <VueEditor v-if="editor" :key="$colorMode.value" v-bind="{ ...attrs, editor }" />
    <template #fallback>
      <slot name="loading" />
    </template>
  </ClientOnly>
</template>

<style>
@import 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
@import 'https://unpkg.com/prism-themes/themes/prism-material-light.css';

.milkdown {
  padding: 0;
  width: 100%;
  height: 100;
  position: relative;
  background: transparent !important;
  box-shadow: none !important;
}
.milkdown > .editor {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
}

.milkdown > .editor > :first-child {
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
