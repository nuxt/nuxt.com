<template>
  <PageHero centered>
    <template #title>
      Sponsors
    </template>
    <template #description>
      <span class="u-text-black">
        Nuxt is an open-source framework totally free to use. If you use Nuxt in your daily work and feel that it has made your life easier, please consider backing us.
      </span>
    </template>

    <template #extra>
      <div class="flex gap-6">
        <UButton
          label="Become a sponsor"
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
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
