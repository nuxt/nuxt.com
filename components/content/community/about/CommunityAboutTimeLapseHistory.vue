<template>
  <div class="flex flex-col gap-y-2">
    <h6 class="text-lg font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h6>
    <p class="text-sm u-text-gray-700">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
  </div>
</template>
