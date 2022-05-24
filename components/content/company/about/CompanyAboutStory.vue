<template>
  <UContainer padded class="pt-8 pb-12">
    <h2 class="text-3xl font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h2>
    <div class="grid grid-cols-1 mt-6 text-lg md:grid-cols-2 u-text-gray-700 gap-x-14 gap-y-8">
      <Markdown :use="$slots.block1" />

      <Markdown :use="$slots.block2" />
    </div>
  </UContainer>
</template>
