<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <a class="relative inline-flex items-center sm:text-lg flex-nowrap u-text-gray-900 group max-w-max" href="https://www.figma.com/community/file/1063820502268406301" target="_blank">
        <span class="flex items-center font-semibold gap-x-2">
          <Markdown :use="$slots.buttonText" unwrap="p" />
          <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
        </span>
        <span
          class="rounded absolute left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:w-full duration-300 transition-ease"
          :class="'bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600'"
        />
      </a>
    </template>

    <template #image>
      <img src="/assets/resources/design-kit/hero.png" alt="Design kit illustration" class="object-contain h-full mx-10 opacity-10 md:opacity-100">
    </template>
  </PageHero>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
