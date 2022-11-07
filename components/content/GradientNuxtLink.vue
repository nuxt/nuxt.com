<template>
  <NuxtLink class="relative inline-flex items-center group flex-nowrap max-w-max">
    <slot />
    <span
      class="gradient-border rounded absolute bg-[length:200%] left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:bg-auto group-hover:w-full duration-300 transition-ease bg-gradient-to-r from-green-400 to-teal-400"
    />
    <Icon v-if="icon" :name="icon" class="w-5 h-5 ml-1 mt-0.5" />
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
