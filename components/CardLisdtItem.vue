<script setup lang="ts">
defineProps({
  location: {
    type: String,
    default: ''
  }
})

</script>

<template>
  <UCard>
    <div v-if="$slots.image || $slots.location" class="flex justify-between">
      <span v-if="location">{{ location }}</span>
      <slot name="image" />
    </div>
    <h4 v-if="$slots.title">
      <slot name="title" />
    </h4>
    <p v-if="$slots.description">
      <slot name="description" />
    </p>
    <slot v-if="$slots.footer" name="footer" />
  </UCard>
</template>
