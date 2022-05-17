<template>
  <div class="relative overflow-hidden">
    <img src="/resources/live-events/hero.png" alt="World map" class="absolute top-0 right-0 object-cover h-full opacity-75 ld:opacity-100">
    <UContainer padded class="relative py-12 sm:py-20 md:py-24 lg:py-28">
      <div class="flex flex-col items-center justify-center py-8 space-y-5 sm:items-start">
        <h1 class="text-5xl font-semibold u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="text-lg font-medium u-text-gray-500 lg:pr-20 md:w-1/2">
          <Markdown use="description" unwrap="p" />
        </p>
        <!-- TODO: update link -->
        <a class="relative inline-flex items-center flex-nowrap u-text-gray-900 group max-w-max" href="#">
          <span class="flex items-center font-semibold gap-x-2">
            <Markdown use="link" unwrap="p" />
            <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
          </span>
          <span
            class="rounded absolute left-0 font-extrabold -bottom-1 h-0.5 w-4 group-hover:w-full duration-300 transition-ease u-bg-gray-900"
          />
        </a>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
