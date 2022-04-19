<template>
  <div class="relative overflow-hidden">
    <img src="/resources/live-events/hero.png" alt="World map" class="absolute right-0 top-0 h-full object-cover opacity-75 ld:opacity-100">
    <UContainer padded class="relative py-12 sm:py-20 md:py-24 lg:py-28">
      <div class="flex flex-col space-y-5 justify-center items-center sm:items-start py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 lg:pr-20 md:w-1/2">
          <Markdown use="description" unwrap="p" />
        </p>
        <!-- TODO: update link -->
        <a class="flex-nowrap items-center u-text-gray-900 relative inline-flex items-center group max-w-max" href="#">
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
