<template>
  <PageHero centered>
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
      <div class="absolute pb-4 inset-x-0 w-full h-full flex items-center justify-center -z-[1]">
        <img src="/assets/community/partners/gradient.webp">
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
