<template>
  <nav class="app-pills">
    <AppLink
      v-for="(link, index) of links"
      :key="index"
      :to="link.to"
      :exact="link.exact"
      class="app-link"
      active-class="active"
      inactive-class="inactive"
    >
      {{ link.label }}
    </AppLink>
  </nav>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

defineProps({
  links: {
    type: Array as PropType<{ to: RouteLocationNormalized | string, exact: boolean, label: string }[]>,
    required: true
  }
})
</script>

<style lang="ts" scoped>
css({
  '.app-pills': {
    display: 'flex',
    alignItems: 'center',
    gap: '{size.16}',

    '.app-link': {
      px: '{size.12}',
      fontSize: '{fontSize.sm}',
      fontWeight: '{fontWeight.medium}',
      borderRadius: '{radii.md}',

      '.active': {
        backgroundColor: '{color.gray.100}',
        color: '{color.gray.700}',

        '@dark': {
          backgroundColor: '{color.gray.900}',
          color: '{color.gray.100}',
        }
      },
      '.inactive': {
        color: '{color.gray.500}',

        '&:hover': {
          color: '{color.gray.700}',

          '@dark': {
            color: '{color.gray.300}',
          }
        }
      }
    }
  }
})
</style>
