<template>
  <UContainer padded class="grid grid-cols-1 pt-32 pb-20 md:grid-cols-2 gap-x-12 gap-y-4 xl:px-60">
    <Markdown :use="$slots.list" unwrap="p" />
  </UContainer>
</template>
