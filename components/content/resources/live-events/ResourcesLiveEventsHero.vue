<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <!-- TODO: update link -->
      <a class="relative inline-flex items-center flex-nowrap u-text-gray-900 sm:text-lg group max-w-max" href="#">
        <span class="flex items-center font-semibold gap-x-2">
          <Markdown :use="$slots.link" unwrap="p" />
          <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
        </span>
        <span
          class="rounded absolute left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:w-full duration-300 transition-ease bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
        />
      </a>
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
