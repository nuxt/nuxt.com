<script setup lang="ts">
const { data: sponsors } = await useFetch('/api/sponsors')
</script>

<template>
  <section>
    <AppContainer v-if="sponsors" class="flex flex-col gap-y-16 pt-16 pb-28" padded>
      <article v-for="(value, key) in sponsors" :key="key" class="flex flex-col items-center gap-y-12">
        <h2 class="text-4xl font-semibold u-text-gray-900 capitalize">
          {{ key }}
        </h2>
        <SponsorsSectionList :sponsors="sponsors[key]" :sponsor-type="key" />
      </article>
    </AppContainer>
  </section>
</template>
