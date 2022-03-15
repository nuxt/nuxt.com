<template>
  <nav>
    <ul class="flex flex-col gap-y-2">
      <DocsAsideItem
        v-for="item in links"
        :key="item.label"
        :item="item"
      />
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineProps({
  links: {
    type: Array,
    default: () => []
  }
})
</script>
