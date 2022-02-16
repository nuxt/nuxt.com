<template>
  <div class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="py-10 sm:pt-16 sm:pb-32">
        <UButton
          v-if="to"
          :to="to"
          variant="transparent"
          icon="heroicons-outline:arrow-sm-left"
          size="sm"
          label="Back"
          class="!p-0 -mt-8 absolute"
        />
        <h2 class="text-3xl font-extrabold u-text-gray-900 sm:text-5xl tracking-tight">
          {{ title }}
        </h2>
        <p v-if="description || $slots.description" class="mt-3 sm:mt-5 text-lg sm:text-xl u-text-gray-400">
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
  },
  to: {
    type: [String, Object],
    default: null
  }
})
</script>
