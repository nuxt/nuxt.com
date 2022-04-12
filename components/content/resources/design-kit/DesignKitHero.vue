<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
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
            class="rounded absolute left-0 font-extrabold -bottom-1 h-0.5 w-4 group-hover:w-full duration-300 ease-in-out"
            :class="'bg-gradient-to-r from-[#00DC82] via-[#34CDFE] to-[#0047E1]'"
          />
        </a>
      </div>
      <div class="flex items-center justify-center lg:col-span-1">
        <img src="/resources/design-kit/hero.png" alt="Design kit illustration" class="h-64 sm:h-80 lg:h-full ">
      </div>
    </div>
  </UContainer>
</template>
