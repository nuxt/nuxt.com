<template>
  <li>
    <div :class="bgClass" class="flex items-center justify-center w-16 h-16 rounded-xl">
      <UIcon :name="icon" :class="[iconClass, bgClass]" class="w-10 h-10" />
    </div>
    <h3 class="mt-6 text-xl font-semibold u-text-gray-900">
      <ContentSlot :use="$slots.title" unwrap="p" />
    </h3>
    <p class="mt-3 text-base u-text-gray-900">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>
  </li>
</template>

<script setup lang="ts">
defineProps({
  bgClass: {
    type: String,
    default: 'bg-gray-50'
  },
  iconClass: {
    type: String,
    default: 'u-text-gray-500'
  },
  icon: {
    type: String,
    default: 'uil:backpack'
  }
})
</script>
