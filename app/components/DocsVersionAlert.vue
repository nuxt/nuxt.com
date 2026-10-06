<script setup lang="ts">
const { meta: docsMeta } = useDocsVersion()
</script>

<template>
  <div v-if="docsMeta.status === 'unsupported'" class="py-4 sm:py-6">
    <UAlert
      icon="i-lucide-triangle-alert"
      variant="subtle"
      color="warning"
      :title="`Nuxt ${docsMeta.major} reached end of life${docsMeta.endOfLife ? ` on ${docsMeta.endOfLife}` : ''}`"
    >
      <template #description>
        It no longer receives bug fixes or security patches.
        <NuxtLink to="/docs/4.x/getting-started/upgrade" class="underline">
          Upgrade to Nuxt 4
        </NuxtLink>
        <template v-if="docsMeta.extendedSupport">
          or get
          <NuxtLink :to="docsMeta.extendedSupport" target="_blank" class="underline">
            extended support from HeroDevs
          </NuxtLink>
        </template>
      </template>
    </UAlert>
  </div>
</template>
