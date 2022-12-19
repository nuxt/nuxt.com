<template>
  <div class="flex flex-col gap-6">
    <h2 v-if="$slots.title" class="font-semibold text-3xl align-middle pb-6">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <ol>
      <ContentSlot :use="$slots.default" unwrap="p" />
    </ol>
  </div>
</template>
