<template>
  <PageHero>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #image>
      <div class="flex h-full items-center justify-center">
        <img src="/assets/support/solutions/hero-light.webp" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation" width="400" height="216">
        <img src="/assets/support/solutions/hero-dark.webp" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation" width="400" height="216">
      </div>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
defineProps({
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
