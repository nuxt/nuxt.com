<template>
  <UContainer :constrained="false" class="flex flex-col items-center justify-center py-32 bg-black gap-y-12 dark:bg-gray-900">
    <h2 class="text-4xl font-semibold text-center text-white leading-[140%]">
      <Markdown :use="$slots.title" unwrap="p" />
    </h2>
    <ul class="grid items-center justify-center grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 place-items-center gap-x-8 sm:gap-x-16">
      <Markdown :use="$slots.items" unwrap="p" />
    </ul>
  </UContainer>
</template>
