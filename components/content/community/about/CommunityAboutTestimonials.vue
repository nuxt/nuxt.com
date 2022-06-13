<template>
  <UContainer padded class="flex flex-col items-center justify-center py-20 gap-y-8">
    <h4 class="text-[24px] font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h4>
    <p class="text-center u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <Markdown :use="$slots.list" unwrap="p" />
  </UContainer>
</template>
