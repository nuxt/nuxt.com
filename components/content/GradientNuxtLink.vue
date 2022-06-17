<template>
  <NuxtLink class="relative inline-flex items-center pb-1 overflow-hidden group flex-nowrap max-w-max">
    <slot />
    <span
      class="rounded absolute -left-[calc(100%-16px)] group-hover:left-0 font-semibold bottom-0 h-0.5 w-full duration-300 transition-ease bg-gradient-to-r from-green-400 via-teal-400 to-indigoblue-600"
    />
    <UIcon v-if="icon" :name="icon" class="w-5 h-5 ml-1 mt-0.5" />
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  icon: {
    type: String,
    default: ''
  }
})
</script>
