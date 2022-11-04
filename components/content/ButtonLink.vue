<template>
  <NuxtLink class="button-link" :to="href">
    <ContentSlot :use="$slots.default" unwrap="p ul li" />

    <template #href>
      <Icon v-if="blank" name="ph:link-simple" class="w-4 h-4 ml-2" />
    </template>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
  href: {
    type: String,
    default: ''
  },
  blank: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium'
  },
  bold: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="postcss" scoped>
a.button-link {
  @apply inline-flex items-center flex-none rounded-md px-3 py-1.5 mb-2 text-sm leading-4 text-gray-900 dark:text-white transition-colors duration-200 border border-green-400 hover:bg-green-500 hover:text-white  focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-green-500 font-semibold;

  &.medium {
    @apply px-4 py-2 text-base leading-4;
  }

  &.large {
    @apply px-6 py-2.5 text-lg leading-6;
  }
}
</style>
