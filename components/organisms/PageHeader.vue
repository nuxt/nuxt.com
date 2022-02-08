<template>
  <div class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="py-10 sm:pt-16 sm:pb-32">
        <h2 class="text-4xl font-extrabold u-text-gray-900 sm:text-5xl sm:tracking-tight">
          {{ title }}
        </h2>
        <p v-if="description || $slots.description" class="mt-5 text-lg sm:text-xl u-text-gray-400">
          <slot name="description">
            {{ description }}
          </slot>
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  }
})
</script>
