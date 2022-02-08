<template>
  <div class="border-t u-border-gray-200 pt-8 pb-16">
    <header v-if="$slots.header">
      <UContainer padded>
        <slot name="header" />
      </UContainer>
    </header>
    <main :class="[header && 'sm:mt-[calc(-6rem-1px)]']">
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps({
  header: {
    type: Boolean,
    default: false
  }
})
</script>
