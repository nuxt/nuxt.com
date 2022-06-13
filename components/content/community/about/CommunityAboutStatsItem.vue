<template>
  <div class="flex flex-col items-center justify-center gap-y-2">
    <h3 class="text-3xl font-semibold md:text-5xl u-text-gray-900">
      <Markdown :use="$slots.stat" unwrap="p" />
    </h3>
    <p class="text-sm md:text-md u-tewt-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
  </div>
</template>
