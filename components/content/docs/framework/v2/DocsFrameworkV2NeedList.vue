<template>
  <ul class="grid grid-cols-1 gap-12 pt-12 sm:grid-cols-2">
    <Markdown :use="$slots.list" unwrap="p" />
  </ul>
</template>
