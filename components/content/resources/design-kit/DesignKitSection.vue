<template>
  <div :class="{ 'u-bg-gray-50': highlight }">
    <UContainer padded :class="sectionClass">
      <p class="text-sm u-text-gray-400 font-bold">
        <Markdown use="category" unwrap="p" />
      </p>
      <h2 class="u-text-gray-900 text-2xl font-semibold pb-6">
        <Markdown use="title" unwrap="p" />
      </h2>
      <h2 v-if="$slots.description" class="u-text-gray-900 text-base pb-10">
        <Markdown use="description" unwrap="p" />
      </h2>
      <ul v-if="$slots.designList" class="grid" :class="listClass">
        <Markdown use="designList" unwrap="p" />
      </ul>
      <div v-if="$slots.typography" class="u-text-gray-900 font-bold">
        <Markdown use="typography" unwrap="p" />
      </div>

      <!-- TODO: color system link -->
      <UButton v-if="secondaries" class="mt-12" variant="secondary" custom-class="u-border-gray-900 u-text-gray-900" label="See color system" />

      <div v-if="$slots.cta" class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Markdown use="cta" unwrap="p" />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  highlight: {
    type: Boolean,
    default: true
  },
  slug: {
    type: String,
    default: ''
  },
  secondaries: {
    type: Boolean,
    default: false
  },
  sectionClass: {
    type: String,
    default: 'py-8'
  },
  listClass: {
    type: String,
    default: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10'
  }
})
</script>
