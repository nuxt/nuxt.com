<template>
  <li class="flex flex-col sm:flex-row gap-4">
    <img :src="`/assets/support/solutions/${icon}-light.svg`" class="w-[44px] h-[44px] dark:hidden">
    <img :src="`/assets/support/solutions/${icon}.svg`" class="w-[44px] h-[44px] hidden dark:block">

    <div class="flex flex-col gap-y-2">
      <h2 class="u-text-gray-900 text-xl font-semibold">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>

      <p class="u-text-gray-800">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: ''
  }
})
</script>
