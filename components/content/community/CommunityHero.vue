<template>
  <DocsHero class="mb-6" :image="image">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="flex flex-col sm:flex-row gap-3 items-start justify-center md:justify-start sm:items-center">
        <UInput
          name="email"
          placeholder="Enter your email"
          class="w-full sm:w-64"
          size="lg"
          required
        />
        <UButton variant="primary-gradient" to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank">
          {{ buttonText }}
        </UButton>
      </div>
    </template>
  </DocsHero>
</template>

<script setup lang="ts">
defineProps({
  image: {
    type: Object,
    default: () => {}
  },
  buttonText: {
    type: String,
    default: 'Subscribe'
  }
})
</script>
