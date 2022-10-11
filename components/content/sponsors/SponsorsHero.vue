<template>
  <PageHero centered>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <span class="u-text-black">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </span>
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
      <div class="absolute pb-4 inset-x-0 w-full h-full flex items-center justify-center -z-[1]">
        <img src="/assets/community/partners/gradient.webp">
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
