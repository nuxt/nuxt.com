<template>
  <div class="flex py-8 relative">
    <div class="flex flex-col gap-6 ">
      <h1 class="text-5xl font-semibold sm:text-4xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <p class="font-medium sm:text-lg u-text-gray-500 lg:pr-8">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <div>
        <ContentSlot :use="$slots.extra" unwrap="p" />
      </div>
    </div>
  </div>
</template>
