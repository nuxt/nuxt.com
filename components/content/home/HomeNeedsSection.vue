<template>
  <div class="flex flex-col">
    <div>
      <ContentSlot :use="$slots.cards" unwrap="p" />
    </div>
    <div class="w-full flex justify-center items-center pt-8">
      <UButton
        to="/modules"
        variant="primary-gradient"
        size="lg"
        :label="buttonText"
        truncate
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Discover our solutions'
  }
})
</script>
