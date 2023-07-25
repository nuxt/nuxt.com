<template>
  <li class="flex flex-col sm:flex-row gap-4">
    <img :src="`/assets/enterprise/support/${icon}-light.svg`" alt="" class="w-[44px] h-[44px] dark:hidden" width="44" height="44">
    <img :src="`/assets/enterprise/support/${icon}.svg`" alt="" class="w-[44px] h-[44px] hidden dark:block" width="44" height="44">

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
