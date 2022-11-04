<script setup lang="ts">
const { toc } = useContent()
const emit = defineEmits(['move'])
</script>

<template>
  <nav class="flex flex-col space-y-1 sm:space-y-2">
    <template v-if="toc?.length">
      <span class="items-center hidden overflow-hidden text-sm font-semibold lg:flex">
        <h2>Table of Contents</h2>
      </span>

      <DocsTocLinks :links="toc" @move="emit('move')" />
    </template>
  </nav>
</template>
