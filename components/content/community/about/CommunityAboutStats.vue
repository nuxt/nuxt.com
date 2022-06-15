<template>
  <UContainer padded class="flex flex-col items-center justify-center py-20 text-center gap-y-12 u-bg-white">
    <h2 class="text-4xl font-semibold u-text-gray-900 leading-[140%]">
      <Markdown :use="$slots.title" unwrap="p" />
    </h2>
    <p class="w-1/2 text-center xl:w-[40%] u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <ul class="grid items-start grid-cols-3 gap-x-2 sm:gap-x-12 md:gap-x-32">
      <Markdown :use="$slots.items" unwrap="p" />
    </ul>
  </UContainer>
</template>
