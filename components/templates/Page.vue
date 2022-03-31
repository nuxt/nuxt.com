<template>
  <div class="flex-1 pt-6 sm:pt-8 pb-16 border-y u-border-gray-200 u-bg-gray-50">
    <header v-if="$slots.header">
      <UContainer padded>
        <slot name="header" />
      </UContainer>
    </header>
    <main :class="[overlap && 'sm:mt-[calc(-6rem-1px)]']">
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps({
  overlap: {
    type: Boolean,
    default: false
  }
})
</script>
