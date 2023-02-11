<template>
  <button class="app-button">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'

defineProps({
  color: computedStyle<keyof PinceauTheme['color']>('blue'),
  ...variants
})
</script>

<style lang="ts" scoped>
css({
  '.app-button': {
    display: 'block',
    fontWeight: '{fontWeight.medium}',

    '&:focus': {
      outline: 'none'
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: '.75'
    },

    ringOffsetColor: '{color.black}',
    ringOffset: 5,
    ring: 2,

    borderRadius: '{radii.md}'
  },
  variants: {
    size: {
      xxs: {

      },
      xs: {

      },
      sm: {

      },
      md: {

      },
      lg: {

      },
      xl: {

      }
    },
    block: {
      true: {

      },
      options: {
        default: true
      }
    },
    loading: {
      true: {

      },
      options: {
        default: false
      }
    },
    disabled: {
      true: {

      },
      options: {
        default: false
      }
    },
    icon: {
      trailing: {

      },
      leading: {

      },
      options: {
        default: 'leading'
      }
    },
    square: {
      true: {

      },
      options: {
        default: false
      }
    },
    truncate: {
      true: {

      },
      options: {
        default: false
      }
    },
    compact: {
      true: {

      },
      options: {
        default: false
      }
    }
  }
})
</style>
