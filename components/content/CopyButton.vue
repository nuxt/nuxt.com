<template>
  <button
    :class="baseClass"
    @click="onClick"
  >
    <UIcon v-if="state === 'copied'" name="uil:check" :class="iconClass" />
    <UIcon v-else name="uil:copy" :class="iconClass" />
  </button>
</template>

<script setup lang="ts">
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  baseClass: {
    type: String,
    default: 'absolute bottom-0 right-0 px-2 py-2 m-1 font-mono text-xs font-semibold leading-none rounded-lg copy focus:outline-none text-warmgray-600 dark:text-warmgray-400 bg-warmgray-200 dark:bg-warmgray-700'
  },
  iconClass: {
    type: String,
    default: 'w-4 h-4'
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
