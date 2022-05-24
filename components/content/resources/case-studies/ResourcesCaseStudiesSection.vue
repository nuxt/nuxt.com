<template>
  <div class="relative py-8" :class="[highlight && 'u-bg-gray-50 sm:py-24 xl:py-36', !highlight && 'sm:py-16']">
    <UContainer padded constrained-class="relative max-w-4xl">
      <h3 v-if="$slots.title" class="flex items-center mb-8 text-2xl font-semibold tracking-tight u-text-gray-900 sm:text-3xl">
        <Markdown :use="$slots.title" unwrap="p" />

        <span v-if="titleLabel" class="absolute left-0 items-center hidden gap-4 text-base font-semibold -translate-x-full xl:flex u-text-gray-400">
          {{ titleLabel }}
          <span class="h-0.5 w-4 block u-bg-gray-300" />
        </span>
      </h3>

      <div v-if="$slots.description" class="flex items-start">
        <div class="prose text-justify dark:prose-invert max-w-none" :class="{ 'xl:w-4/5': highlight }">
          <Markdown :use="$slots.description" unwrap="p" />
        </div>

        <span v-if="descriptionLabel" class="absolute left-0 items-center hidden gap-4 text-base font-semibold -translate-x-full xl:flex u-text-gray-400">
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
  imageClass: {
    type: String,
    default: 'bottom-0 opacity-20 xl:opacity-100 xl:h-2/3 2xl:h-4/5 h-full'
  }
})
</script>
