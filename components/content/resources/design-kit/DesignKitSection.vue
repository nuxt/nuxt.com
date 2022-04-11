<template>
  <div :class="{ 'u-bg-gray-50': highlight }">
    <UContainer padded class="py-8">
      <p class="text-sm u-text-gray-400 font-bold">
        <Markdown use="category" unwrap="p" />
      </p>
      <h2 class="u-text-gray-900 text-2xl font-semibold pb-6">
        <Markdown use="title" unwrap="p" />
      </h2>
      <h2 class="u-text-gray-900 text-base pb-10">
        <Markdown use="description" unwrap="p" />
      </h2>
      <ul class="grid" :class="listClass">
        <Markdown use="designList" unwrap="p" />
      </ul>
      <!-- TODO: color system link -->
      <UButton v-if="secondaries" class="mt-12" variant="secondary" custom-class="u-border-gray-900 u-text-gray-900" label="See color system" />
    </UContainer>
  </div>
</template>
<script setup>
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
    type: String,
    default: ''
  },
  listClass: {
    type: String,
    default: 'grid-cols-3 gap-10'
  }
})

// const { data: file } = await useAsyncData(props.slug, () => queryContent(`/resources/design-kit/.collections/${props.slug}`).findOne())
</script>
