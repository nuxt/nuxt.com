<template>
  <div class="py-8 relative" :class="[highlight && 'u-bg-gray-50 sm:py-24 xl:py-36', !highlight && 'sm:py-16']">
    <UContainer padded constrained-class="max-w-4xl relative">
      <img v-if="iconImage" :src="iconImage" class="w-8 h-8 mb-4">

      <h3 v-if="$slots.title" class="text-3xl tracking-tight font-bold u-text-gray-900 sm:text-3xl mb-8 flex items-center">
        <Markdown use="title" unwrap="p" />

        <span v-if="titleLabel" class="hidden xl:flex u-text-gray-400 font-semibold text-base absolute left-0 items-center gap-4 -translate-x-full">
          {{ titleLabel }}
          <span class="h-0.5 w-4 block u-bg-gray-300" />
        </span>
      </h3>

      <div v-if="$slots.description" class="flex items-start">
        <div class="prose prose-gray dark:prose-invert text-justify max-w-full" :class="{ 'xl:w-4/5': highlight }">
          <Markdown use="description" unwrap="p" />
        </div>

        <span v-if="descriptionLabel" class="hidden xl:flex u-text-gray-400 font-semibold text-base absolute left-0 items-center gap-4 -translate-x-full">
          {{ descriptionLabel }}
          <span class="h-0.5 w-4 block u-bg-gray-300" />
        </span>
      </div>
    </UContainer>

    <img v-if="image" :src="image" class="absolute right-0" :class="imageClass">
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
    default: 'The Nuxt Team'
  },
  descriptionLabel: {
    type: String,
    default: null
  },
  highlight: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: null
  },
  iconImage: {
    type: String,
    default: null
  },
  imageClass: {
    type: String,
    default: 'bottom-0 opacity-20 xl:opacity-100 xl:h-2/3 2xl:h-4/5 h-full'
  }
})
</script>
