<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse grid-cols-1 gap-8 md:grid sm:grid-cols-2 lg:grid-cols-3">
      <div class="flex flex-col justify-center py-8 space-y-5 lg:col-span-2">
        <h1 class="text-5xl font-semibold u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="text-lg font-medium u-text-gray-500 lg:pr-20">
          <Markdown use="description" unwrap="p" />
        </p>
        <a class="relative inline-flex items-center flex-nowrap u-text-gray-900 group max-w-max" href="https://www.figma.com/community/file/1063820502268406301" target="_blank">
          <span class="flex items-center font-semibold gap-x-2">
            <Markdown use="buttonText" unwrap="p" />
            <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
          </span>
          <span
            class="rounded absolute left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:w-full duration-300 transition-ease"
            :class="'bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600'"
          />
        </a>
      </div>
      <div class="flex items-center justify-center lg:col-span-1">
        <img src="/resources/design-kit/hero.png" alt="Design kit illustration" class="h-64 sm:h-80 lg:h-full ">
      </div>
    </div>
  </UContainer>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
