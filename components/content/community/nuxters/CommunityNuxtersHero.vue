<template>
  <PageHero description-width-class="sm:max-w-xl">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <div class="flex flex-wrap gap-6 sm:flex-nowrap sm:items-center">
        <UButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button"
          size="lg"
          class="flex-shrink-0"
        />
        <CommunityNuxtersFilterSearch class="hidden md:block" />
      </div>
    </template>

    <template #background>
      <CommunityNuxtersHeroMap class="object-cover h-full opacity-50 lg:opacity-100" />
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
