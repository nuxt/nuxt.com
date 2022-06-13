<template>
  <div class="flex items-center gap-x-4 sm:gap-x-8 max-w-[520px] pr-2">
    <div v-if="$slots.year" class="lg:hidden py-[7px] px-6 text-xl backdrop-blur-lg rounded-[7px] font-semibold u-text-gray-900 transition-all duration-300">
      <Markdown :use="$slots.year" unwrap="p" />
    </div>
    <div>
      <h6 class="pb-2 text-lg font-semibold u-text-gray-900">
        <Markdown :use="$slots.title" unwrap="p" />
      </h6>
      <p class="text-sm u-text-gray-700">
        <Markdown :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </div>
</template>
