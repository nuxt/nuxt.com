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
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '{fontWeight.medium}',
    fontSize: (props) => `{fontSize.${props.size === 'xs' ? 'xs' : 'sm'}}`,
    py: (props) => `{size.${props.size === 'xl' ? '4' : '2'}}`
  },
  variants: {
    variant: {
      base: {
        backgroundColor: (props) => `{color.${props.color}.100}`,
        color: (props) => `{color.${props.color}.800}`,

        '@dark': {
          backgroundColor: (props) => `{color.${props.color}.700}`,
          color: (props) => `{color.${props.color}.100}`
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
        px: '{size.8}',
      },
      md: {
        px: '{size.10}',
      },
      lg: {
        px: '{size.12}',
      },
      xl: {
        px: '{size.16}',
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
