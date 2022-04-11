<template>
  <UContainer padded class="py-12">
    <div class="grid grid-cols-3">
      <div class="flex flex-col space-y-5 col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 lg:pr-20">
          <Markdown use="description" unwrap="p" />
        </p>
        <!-- TODO: update figma link -->
        <a class="flex-nowrap items-center u-text-gray-900 relative inline-flex items-center group max-w-max" href="https://www.figma.com/@nuxtjs">
          <span class="flex items-center font-semibold gap-x-2">
            <Markdown use="buttonText" unwrap="p" />
            <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
          </span>
          <span
            class="rounded absolute left-0 font-extrabold -bottom-1 h-0.5 w-4 group-hover:w-full transition-all"
            :class="'bg-gradient-to-r from-[#00DC82] via-[#34CDFE] to-[#0047E1]'"
          />
        </a>
      </div>
      <img src="/resources/design-kit/hero.png" alt="Design kit illustration">
    </div>
  </UContainer>
</template>
