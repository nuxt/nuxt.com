<template>
  <div class="flex flex-col">
    <h2 v-if="$slots.title" class="font-semibold text-3xl align-middle">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h2>
    <ContentSlot v-if="$slots.default" :use="$slots.default" unwrap="p" />
  </div>
</template>

<style scoped lang="postcss">
:deep(ol) {
  @apply ml-4 my-0;
  ::marker {
    @apply text-3xl font-semibold;
  }
}
</style>
