<template>
  <UContainer class="flex flex-col items-center justify-center py-20 gap-y-4" padded>
    <div class="flex gap-x-[10px] items-center">
      <Logo class="w-[50px] h-[33px] u-text-black" />
      <h2 class="block text-3xl font-semibold u-text-black">
        <span>+ <ContentSlot :use="$slots.title" unwrap="p" /></span>
      </h2>
    </div>
    <p class="text-center u-text-gray-500 md:w-1/2">
      <ContentSlot :use="$slots.description" unwrap="p" />
    </p>
    <div class="flex h-10 mt-8 lg:mt-0 lg:flex-shrink-0 gap-y-3 gap-x-8">
      <UButton
        :label="buttonText"
        variant="primary"
        class="w-36"
        size="lg"
        to="/company/contact"
        block
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Sign up today'
  }
})
</script>
