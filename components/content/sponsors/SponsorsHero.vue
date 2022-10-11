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
      <div class="absolute bottom-2 left-0 right-0 w-full h-full flex items-center justify-center -z-[1]">
        <span class="_ellipse" />
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

<style scoped>
._ellipse {
  width: 300.14px;
  height: 100.22px;
  inset: 0;
  filter: blur(60px);
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 1) 2.27%, rgba(26, 214, 255, 1) 60.88%, #00DC82 80%);
  transform: matrix(-0.97, 0.24, 0.24, 0.97, 0, 0);
}
</style>
