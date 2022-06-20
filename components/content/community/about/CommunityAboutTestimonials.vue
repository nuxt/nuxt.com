<template>
  <UContainer padded class="flex flex-col items-center justify-center pt-20 pb-4 sm:py-20 gap-y-8">
    <h4 class="text-[24px] font-semibold u-text-gray-900 leading-[140%]">
      <Markdown :use="$slots.title" unwrap="p" />
    </h4>
    <p class="mb-8 text-center u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <Markdown :use="$slots.list" unwrap="p" />
  </UContainer>
</template>
