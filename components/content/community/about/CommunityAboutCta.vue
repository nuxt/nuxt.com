<template>
  <UContainer padded class="grid grid-cols-1 pt-20 pb-16 sm:pb-32 md:grid-cols-2 gap-x-12 gap-y-8 xl:px-60">
    <ContentSlot :use="$slots.list" unwrap="p" />
  </UContainer>
</template>
