<template>
  <div class="w-[801px] h-[415px] flex flex-col items-center gap-y-4">
    <div class="rounded-lg pt-9 w-[371px] h-[143px] bg-gray-400 pb-9" />
    <div class="relative w-full">
      <span class="italic text-gray-500 transition-opacity duration-300 absolute left-[230px]" :class="currentSection === 3 ? 'opacity-100' : 'opacity-0'">
        Type your text in code editor
      </span>
      <span class="text-gray-800 transition-opacity duration-300 absolute left-[230px]" :class="currentSection === 4 ? 'opacity-100' : 'opacity-0'">
        I typed a little content to show how it will work
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})
</script>
