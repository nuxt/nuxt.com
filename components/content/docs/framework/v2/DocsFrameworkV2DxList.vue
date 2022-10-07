<template>
  <ul class="grid grid-cols-1 gap-8 pt-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    <ContentSlot :use="$slots.list" unwrap="p" />
  </ul>
</template>
