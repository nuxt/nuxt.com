<script lang="ts">
import { defineComponent } from 'vue'
import { paths, PathKey } from './icons'

export default defineComponent({
  props: {
    name: {
      type: String as () => PathKey,
      required: true,
      validator: (name: string) => Boolean(paths[name as PathKey])
    }
  },
  setup (props) {
    return {
      path: paths[props.name]
    }
  }
})
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="path" />
  </svg>
</template>
