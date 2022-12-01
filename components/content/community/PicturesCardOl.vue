<template>
  <li class="flex flex-row content-start gap-6">
    <p v-if="$slots.numbers" class="font-semibold text-black text-5xl">
      <ContentSlot :use="$slots.numbers" unwrap="p" />
    </p>
    <p v-if="$slots.description" class="text-lg font-normal">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>
  </li>
</template>
