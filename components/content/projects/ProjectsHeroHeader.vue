<template>
  <div class="gap-4 md:flex">
    <UBadge
      variant=""
      base-class="inline-flex items-center font-semibold border bg-indigoblue-100 border-indigoblue-500 dark:bg-black text-indigoblue-700 dark:text-white"
      size="lg"
    >
      <Markdown :use="$slots.badge" unwrap="p" />
    </UBadge>
    <div class="u-text-gray-500">
      <Markdown :use="$slots.description" unwrap="p" />
    </div>
  </div>
</template>
