<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'
const props = defineProps({
  src: {
    type: String,
    required: true
  }
})
const url = computed(() => withoutTrailingSlash(props.src))
</script>

<template>
  <div class="relative my-4 border dark:border-gray-900 rounded-lg overflow-hidden">
    <a :href="src" target="_blank" rel="noopener" class="border-b dark:border-gray-800 py-2 px-2 text-xs flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 text-center hover:text-black dark:hover:text-white">{{ url }} <Icon name="uil:external-link-alt" /></a>
    <iframe :src="src" frameborder="0" allowfullscreen class="bg-white w-full aspect-[3/4] md:aspect-[16/9]" />
  </div>
</template>
