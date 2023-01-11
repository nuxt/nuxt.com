<template>
  <div class="flex pt-16 relative">
    <div class="flex flex-col gap-6">
      <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p v-if="$slots.description" class="font-medium sm:text-lg u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div v-if="$slots.extra">
        <ContentSlot :use="$slots.extra" unwrap="div" />
      </div>
    </div>
  </div>
</template>
