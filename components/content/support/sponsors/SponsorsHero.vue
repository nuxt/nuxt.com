<template>
  <PageHero>
    <template #title>
      {{ title }}
    </template>

    <template #description>
      <span class="u-text-black">
        {{ description }}
      </span>
    </template>

    <template #extra>
      <div class="flex gap-6">
        <UButton
          :label="buttonText"
          to="https://github.com/sponsors/nuxt"
          variant="primary-gradient"
          size="lg"
        />
      </div>
    </template>

    <template #image>
      <div class="flex h-full items-center justify-center">
        <img src="/assets/support/sponsors/hero-light.webp" class="dark:hidden object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
        <img src="/assets/support/sponsors/hero-dark.webp" class="hidden dark:block object-contain h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
defineProps({
  buttonText: {
    type: String,
    default: 'Become a sponsor'
  },
  title: {
    type: String,
    default: 'Sponsors'
  },
  description: {
    type: String,
    default: 'Nuxt is an open-source framework totally free to use thanks to our generous sponsors. If you use Nuxt in your daily work and feel that it has made your life easier, please consider backing us.'
  }
})
</script>
