<template>
  <span class="app-badge">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'

defineProps({
  color: computedStyle<keyof PinceauTheme['color']>('blue'),
  label: {
    type: String,
    default: ''
  },
  ...variants
})
</script>

<style lang="ts" scoped>
css({
  '.app-badge': {
    '--badge-bg-base': (props) => `{color.${props.color}.100}`,
    '--badge-bg-base-dark': (props) => `{color.${props.color}.700}`,
    '--badge-text-base': (props) => `{color.${props.color}.800}`,
    '--badge-text-base-dark': (props) => `{color.${props.color}.100}`,

    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '{fontWeight.medium}'
  },
  variants: {
    variant: {
      base: {
        backgroundColor: '{badge.bg.base}',
        color: '{badge.text.base}',

        '@dark': {
          backgroundColor: '{badge.bg.base.dark}',
          color: '{badge.text.base.dark}'
        }
      },
      primary: {
        backgroundColor: '{color.gray.100}',
        color: '{color.gray.800}',

        '@dark': {
          backgroundColor: '{color.gray.700}',
          color: '{color.gray.200}'
        }
      },
      secondary: {
        backgroundColor: '{color.white}',
        color: '{color.gray.700}',

        '@dark': {
          backgroundColor: '{color.black}',
          color: '{color.gray.300}'
        }
      },
      options: {
        default: 'primary'
      }
    },
    size: {
      sm: {
        fontSize: '{fontSize.xs}',
        px: '{size.8}',
        py: '{size.2}'
      },
      md: {
        fontSize: '{fontSize.sm}',
        px: '{size.10}',
        py: '{size.2}'
      },
      lg: {
        fontSize: '{fontSize.sm}',
        px: '{size.12}',
        py: '{size.2}'
      },
      xl: {
        fontSize: '{fontSize.sm}',
        px: '{size.16}',
        py: '{size.4}'
      },
      options: {
        default: 'md'
      }
    },
    rounded: {
      false: {
        borderRadius: '{radii.sm}'
      },
      true: {
        borderRadius: '{radii.full}'
      },
      options: {
        default: false
      }
    }
  }
})
</style>
