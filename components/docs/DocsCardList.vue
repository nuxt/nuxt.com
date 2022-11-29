<template>
  <ul class="flex flex-col gap-y-2">
    <ContentSlot :use="$slots.default" unwrap="p" />
  </ul>
</template>
