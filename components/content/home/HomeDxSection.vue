<template>
  <div class="flex flex-col gap-y-8">
    <ContentSlot :use="$slots.default" unwrap="p" />
    <div class="w-full flex justify-center items-center pt-8">
      <UButton
        :to="buttonLink"
        variant="primary-gradient"
        size="lg"
        :label="buttonText"
        truncate
        class="focus-visible:ring-2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Try it now'
  },
  buttonLink: {
    type: String,
    default: '/'
  }
})
</script>
