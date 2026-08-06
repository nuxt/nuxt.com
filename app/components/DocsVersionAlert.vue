<script setup lang="ts">
const { version } = useDocsVersion()
</script>

<template>
  <UAlert
    v-if="version.status === 'unsupported'"
    icon="i-lucide-triangle-alert"
    variant="subtle"
    color="warning"
    class="mt-4 sm:mt-8"
    :title="`Nuxt ${version.shortTag.slice(1)} reached end of life${version.endOfLife ? ` on ${version.endOfLife}` : ''}`"
  >
    <template #description>
      It no longer receives bug fixes or security patches.
      <NuxtLink to="/docs/4.x/getting-started/upgrade" class="underline">
        Upgrade to Nuxt 4
      </NuxtLink>
      <template v-if="version.extendedSupport">
        or get
        <NuxtLink :to="version.extendedSupport" target="_blank" class="underline">
          extended support from HeroDevs
        </NuxtLink>
      </template>
    </template>
  </UAlert>
</template>
