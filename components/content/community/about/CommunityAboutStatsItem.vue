<template>
  <div class="flex flex-col items-center justify-center gap-y-2">
    <h3 class="text-5xl font-semibold u-text-gray-900">
      <ContentSlot :use="$slots.stat" unwrap="p" />
    </h3>
    <p class="u-text-gray-600">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>
  </div>
</template>
