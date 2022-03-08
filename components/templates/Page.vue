<template>
  <div class="flex-1 pt-8 pb-16 border-t u-border-gray-200">
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
