<template>
  <div class="py-8 sm:py-16 relative" :class="[highlight && 'u-bg-gray-50']">
    <UContainer padded constrained-class="max-w-4xl relative">
      <UIcon v-if="icon" :name="icon" class="w-6 h-6 mb-4" />
      <h3 v-if="$slots.title" class="text-3xl tracking-tight font-bold u-text-gray-900 sm:text-3xl mb-8 flex items-center">
        <Markdown use="title" unwrap="p" />

        <span v-if="titleLabel" class="hidden xl:flex u-text-gray-400 font-semibold text-base absolute left-0 items-center gap-4 -translate-x-full">
          {{ titleLabel }}
          <span class="h-0.5 w-4 block u-bg-gray-300" />
        </span>
      </h3>

      <div v-if="$slots.description" class="flex items-start">
        <div class="prose prose-gray dark:prose-invert !max-w-full">
          <Markdown use="description" unwrap="p" />
        </div>

        <span v-if="descriptionLabel" class="hidden xl:flex u-text-gray-400 font-semibold text-base absolute left-0 items-center gap-4 -translate-x-full">
          {{ descriptionLabel }}
          <span class="h-0.5 w-4 block u-bg-gray-300" />
        </span>
      </div>
    </UContainer>
    <slot name="image" />
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: null
  },
  titleLabel: {
    type: String,
    default: null
  },
  descriptionLabel: {
    type: String,
    default: null
  },
  highlight: {
    type: Boolean,
    default: false
  }
})
</script>
