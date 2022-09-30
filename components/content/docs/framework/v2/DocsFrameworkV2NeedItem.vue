<template>
  <li>
    <NuxtLink :to="to" target="_blank">
      <UCard padded shadow-class="transition-shadow duration-300 shadow-none hover:shadow-md hover:drop-shadow-md hover:shadow-inner-md" class="p-2 group">
        <div class="flex justify-between pb-4">
          <div class="relative w-8 h-8">
            <img :src="`/assets/docs/v2/${icon}`" class="absolute top-0 w-full h-full transition-opacity duration-300 opacity-100 group-hover:opacity-0" :alt="`${icon} illustration`">
            <img :src="`/assets/docs/v2/${iconColor}`" class="absolute top-0 w-full h-full transition-opacity duration-300 opacity-0 group-hover:opacity-100" :alt="`${icon} green illustration`">
          </div>
          <UIcon name="uil:arrow-right" alt="arrow" class="w-6 h-6 transition duration-300 opacity-0 mr-coll4 group-hover:translate-x-4 group-hover:opacity-100" />
        </div>
        <h5 class="pb-4 text-2xl font-semibold">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h5>
        <p class="u-text-gray-500">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
      </UCard>
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
defineProps({
  to: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: ''
  }
})
</script>
