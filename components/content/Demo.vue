<script setup lang="ts">
defineProps({
  src: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="relative my-4 border dark:border-gray-900 rounded-lg overflow-hidden">
    <a :href="src" target="_blank" rel="noopener" class="block py-2 px-2 text-xs text-gray-600 dark:text-gray-400 text-center hover:text-black dark:hover:text-white">{{ src }}</a>
    <iframe :src="src" frameborder="0" allowfullscreen class="w-full aspect-[3/4] md:aspect-[16/9]" />
  </div>
</template>
