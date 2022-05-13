<template>
  <button
    class="absolute bottom-0 right-0 px-2 py-2 m-1 font-mono text-xs font-semibold leading-none rounded-lg  copy focus:outline-none text-warmgray-600 dark:text-warmgray-400 bg-warmgray-200 dark:bg-warmgray-700"
    @click="onClick"
  >
    <UIcon v-if="state === 'copied'" name="fa-check" class="w-4 h-4" />
    <UIcon v-else name="fa-copy" class="w-4 h-4" />
  </button>
</template>

<script setup lang="ts">
const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const { $clipboard } = useNuxtApp()

const state = ref('init')

const onClick = () => {
  // Copy text
  $clipboard.copy(
    props.content,
    {
      title: 'Code copied to clipboard!'
    }
  )

  // Update local icon state
  state.value = 'copied'
  window.setTimeout(() => {
    state.value = 'init'
  }, 2000)
}
</script>
