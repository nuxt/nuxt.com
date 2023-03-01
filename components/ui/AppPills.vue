<template>
  <nav class="app-pills">
    <NuxtLink
      v-for="(link, index) of links"
      :key="index"
      :to="link.to"
      :exact="link.exact"
      class="app-link"
      :class="{ 'link-active': router.fullPath === link.to }"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

const router = useRoute()

defineProps({
  links: {
    type: Array as PropType<{ to: RouteLocationNormalized | string, exact: boolean, label: string }[]>,
    required: true
  }
})
</script>

<style lang="ts">
css({
  '.link-active': {
    backgroundColor: '{color.gray.100} !important',
    color: '{color.gray.700} !important',

    '@dark': {
      backgroundColor: '{color.gray.900} !important',
      color: '{color.gray.100} !important',
    }
  },

  '.app-pills': {
    display: 'flex',
    alignItems: 'center',
    gap: '{size.16}',

    '.app-link': {
      fontSize: '{fontSize.sm}',
      fontWeight: '{fontWeight.medium}',
      borderRadius: '{radii.md}',
      color: '{color.gray.500}',
      backgroundColor: 'transparent',

      '&:hover': {
        color: '{color.gray.700}',

        '@dark': {
          color: '{color.gray.300}',
        }
      }
    }
  }
})
</style>
