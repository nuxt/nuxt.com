<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <!-- TODO: update link -->
      <GradientNuxtLink icon="uil:arrow-right" to="#" class="font-semibold u-text-gray-900 sm:text-lg">
        <ContentSlot :use="$slots.link" unwrap="p" />
      </GradientNuxtLink>
    </template>
    <template #background>
      <img src="/assets/resources/live-events/hero.svg" alt="World map" class="object-cover h-full opacity-30">
      <div class="h-[100px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div class="w-[100px] absolute left-0 inset-y-0 bg-gradient-to-r from-white dark:from-black to-transparent" />
      <div class="h-[100px] absolute bottom-0 inset-x-0 bg-gradient-to-t from-white dark:from-black to-transparent" />
    </template>
  </PageHero>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
