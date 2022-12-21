<template>
  <div class="relative flex flex-col justify-between p-2.5 sm:p-4">
    <div>
      <h2 v-if="$slots.title" class="text-3xl font-semibold sm:text-5xl u-text-gray-900 mb-2 mt-2">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <h2 v-if="$slots.extraTitle" class="font-semibold u-text-gray-900" :class="fontSizeClass">
        <ContentSlot :use="$slots.extraTitle" unwrap="p" />
      </h2>
      <p class="u-text-gray-500" :class="descriptionClass">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps({
  fontSizeClass: {
    type: String,
    default: ''
  },
  descriptionClass: {
    type: String,
    default: ''
  }
})
</script>
