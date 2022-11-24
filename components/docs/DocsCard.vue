<template>
  <li class="flex justify-between border border-gray-200 dark:border-gray-800 rounded-lg p-2">
    <div>
      <h1 v-if="$slots.title" class="text-4xl font-semibold sm:text-5xl u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h1>
      <h2 v-if="$slots.extraTitle" class="font-semibold sm:text-lg u-text-gray-900">
        <ContentSlot :use="$slots.extraTitle" unwrap="p" />
      </h2>
      <p class="font-medium sm:text-lg u-text-gray-500">
        <ContentSlot :use="$slots.description" unwrap="p" class="lg:w-2/3" />
      </p>
      <div v-if="$slots.image" class="flex h-full w-full gap-x-4 items-end justify-center">
        <img src="`/assets/docs/getting-started/views/${image}`" width="143" height="136" class="dark:hidden object-cover h-[136px] w-[143px] opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/docs/getting-started/views/hero-dark.png" width="143" height="136" class="hidden dark:block object-cover h-[136px] w-[143px] opacity-0 md:opacity-100" role="presentation">
      </div>
    </div>
  </li>
</template>
