<template>
  <div class="flex-1 pt-6 pb-16 border-t sm:pb-32 sm:pt-8 u-border-gray-200">
    <header v-if="$slots.header">
      <UContainer padded>
        <slot name="header" />
      </UContainer>
    </header>
    <main :class="[overlap && 'sm:mt-[calc(-6rem-1px)]']">
      <UContainer padded>
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
