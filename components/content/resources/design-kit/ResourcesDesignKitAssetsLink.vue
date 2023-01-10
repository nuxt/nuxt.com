<template>
  <a class="relative inline-flex items-center group flex-nowrap max-w-max" href="/assets/design-kit/nuxt-assets.zip" download>
    {{ linkText }}
    <span
      class="gradient-border rounded absolute bg-[length:200%] left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:bg-auto group-hover:w-full duration-300 transition-ease bg-gradient-to-r from-green-400 to-teal-400"
    />
    <Icon name="uil:arrow-right" class="w-5 h-5 ml-1 mt-0.5" />
  </a>
</template>

<script setup lang="ts">
defineProps({
  linkText: {
    type: String,
    default: 'Download design kit'
  }
})
</script>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
