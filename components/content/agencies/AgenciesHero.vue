<template>
  <PageHero>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="flex gap-6">
        <UButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button"
          size="lg"
        />
      </div>
    </template>

    <template #image>
      <div class="flex h-full items-center justify-center">
        <img src="/assets/support/agencies/hero-light.svg" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
        <img src="/assets/support/agencies/hero-dark.svg" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
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
