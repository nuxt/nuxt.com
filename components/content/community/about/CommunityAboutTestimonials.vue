<template>
  <UContainer padded class="flex flex-col items-center justify-center py-20">
    <h4 class="mb-2 text-2xl font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h4>
    <p class="mb-8 text-center u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <Markdown :use="$slots.list" unwrap="p" />
  </UContainer>
</template>
