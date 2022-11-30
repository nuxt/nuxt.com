<template>
  <ul class="grid grid-cols-1 pt-6 sm:grid-cols-2 border-gray-200 dark:border-gray-800 rounded-lg">
    <ContentSlot :use="$slots.default" unwrap="p" />
  </ul>
</template>
