<script setup lang="ts">
defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const { data } = await useFetch('/api/sponsors')
</script>

<template>
  <section>
    <UContainer v-if="data" class="flex flex-col gap-y-16 pt-16 pb-28">
      <article v-for="(value, key) in data.sponsors" :key="key" class="flex flex-col items-center gap-y-12">
        <h2 class="text-4xl font-semibold u-text-gray-900 capitalize">
          {{ key }}
        </h2>
        <SponsorsSectionList :sponsors="data.sponsors[key]" :sponsor-type="key" />
      </article>
    </UContainer>
  </section>
</template>
