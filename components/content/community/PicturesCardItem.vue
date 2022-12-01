<template>
  <div class="flex flex-col gap-2">
    <h2 v-if="$slots.title" class="font-semibold text-3xl">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <ol>
      <ContentSlot :use="$slots.default" unwrap="p" />
    </ol>
  </div>
</template>
