<template>
  <div :class="{ 'u-bg-gray-50': highlight }">
    <div class="container" :class="sectionClass">
      <p v-if="$slots.category" class="text-sm font-semibold u-text-gray-400">
        <ContentSlot :use="$slots.category" unwrap="p" />
      </p>
      <h2 v-if="$slots.title" class="pb-4 text-2xl font-semibold u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h2>
      <p v-if="$slots.description" class="pb-10 prose dark:prose-invert max-w-none">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
      <h2 v-if="$slots.titleExtra" class="pb-6 text-lg font-semibold u-text-gray-900">
        <ContentSlot :use="$slots.titleExtra" unwrap="p" />
      </h2>
      <ul v-if="$slots.designList" class="grid" :class="listClass">
        <ContentSlot :use="$slots.designList" unwrap="p" />
      </ul>
      <div v-if="$slots.typography" class="font-semibold u-text-gray-900">
        <ContentSlot :use="$slots.typography" unwrap="p" />
      </div>

      <!-- TODO: color system link -->
      <AppButton v-if="secondaries" class="mt-12" variant="secondary" label="See color system" size="lg" />

      <div v-if="$slots.cta" class="grid grid-cols-1 gap-12 md:grid-cols-2">
        <ContentSlot :use="$slots.cta" unwrap="p" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  highlight: {
    type: Boolean,
    default: true
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
