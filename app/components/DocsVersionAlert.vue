<script setup lang="ts">
const { version } = useDocsVersion()
</script>

<template>
  <UAlert
    v-if="version.status === 'unsupported'"
    icon="i-lucide-triangle-alert"
    variant="subtle"
    color="warning"
    class="mt-8"
    :title="`Nuxt ${version.shortTag.slice(1)} reached end of life${version.endOfLife ? ` on ${version.endOfLife}` : ''}`"
  >
    <template #description>
      It no longer receives bug fixes or security patches. Follow the
      <NuxtLink to="/docs/4.x/getting-started/upgrade" class="underline">
        upgrade guide
      </NuxtLink>
      to move to Nuxt 4, the current stable release.
      <template v-if="version.extendedSupport">
        If you need to stay on Nuxt {{ version.shortTag.slice(1) }}, our partner HeroDevs offers
        <NuxtLink :to="version.extendedSupport" target="_blank" class="underline">
          Never-Ending Support
        </NuxtLink>
        with ongoing security and compatibility patches.
      </template>
    </template>
  </UAlert>
</template>
