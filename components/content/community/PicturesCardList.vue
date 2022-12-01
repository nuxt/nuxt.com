<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <ContentSlot :use="$slots.default" unwrap="p" />
  </div>
</template>
