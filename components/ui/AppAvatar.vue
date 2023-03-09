<template>
  <span class="app-avatar">
    <img v-if="url && !error" :src="url" :alt="alt" :onerror="() => onError()" class="image">
    <span v-else-if="text || placeholder">{{ text || placeholder }}</span>
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps({
  src: {
    type: [String, Boolean],
    default: null
  },
  alt: {
    type: String,
    default: null
  },
  text: {
    type: String,
    default: null
  },
  ...variants
})

const url = computed(() => {
  if (typeof props.src === 'boolean') {
    return null
  }
  return props.src
})

const placeholder = computed(() => {
  return (props.alt || '').split(' ').map(word => word.charAt(0)).join('').substring(0, 2)
})

const error = ref(false)

watch(() => props.src, () => {
  if (error.value) {
    error.value = false
  }
})

function onError () {
  error.value = true
}
</script>

<style lang="ts" scoped>
css({
  '.app-avatar': {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '{color.gray.100}',

    '@dark': {
      backgroundColor: '{color.gray.800}',
    },

    '> img': {
      height: 'inherit',
      width: 'inherit',
      fontSize: 'inherit',
      borderRadius: 'inherit'
    },

    '> span': {
      fontSize: '{fontSize.xs}',
      lineHeight: 1,
      fontWeight: '{fontWeight.medium}',
      color: '{color.black}',
      textAlign: 'left',
      lineClamp: 1,
      wordBreak: 'break-all',

      '@dark': {
        color: '{color.white}',
      }
    },
  },

  variants: {
      size: {
        xxxs: {
          height: '{size.16}',
          width: '{size.16}',
          fontSize: '{fontSize.xs}',
        },
        xxs: {
          height: '{size.20}',
          width: '{size.20}',
          fontSize: '{fontSize.xs}',
        },
        xs: {
          height: '{size.24}',
          width: '{size.24}',
          fontSize: '{fontSize.xs}',
        },
        sm: {
          height: '{size.32}',
          width: '{size.32}',
          fontSize: '{fontSize.sm}',
        },
        md: {
          height: '{size.40}',
          width: '{size.40}',
          fontSize: '{fontSize.base}',
        },
        lg: {
          height: '{size.48}',
          width: '{size.48}',
          fontSize: '{fontSize.lg}',
        },
        xl: {
          height: '{size.56}',
          width: '{size.56}',
          fontSize: '{fontSize.xl}',
        },
        options: {
          default: 'md'
        }
      },
      rounded: {
        true: {
          borderRadius: '{radii.full}'
        },
        false: {
          borderRadius: '{radii.sm}'
        },
        options: {
          default: true
        }
      }
    }
})
</style>
