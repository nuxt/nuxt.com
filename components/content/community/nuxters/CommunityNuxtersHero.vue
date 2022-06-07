<template>
  <PageHero description-width-class="sm:max-w-xl">
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <div class="flex flex-wrap w-full gap-4 sm:items-center sm:max-w-xl">
        <UButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button"
          size="lg"
        />
        <CommunityNuxtersFilterSearch class="w-full max-w-sm" />
      </div>
    </template>
    <template #background>
      <img src="/assets/resources/live-events/hero.svg" alt="World map" class="object-cover h-full opacity-30">
      <div class="h-[100px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div class="w-[100px] absolute left-0 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent" />
      <div class="h-[100px] absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-black to-transparent" />
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
