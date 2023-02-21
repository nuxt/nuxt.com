<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'
import { isColorPalette } from '../../utils'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  backgroundColor: computedStyle<keyof PinceauTheme['color']>('white'),
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  customClass: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  timeout: {
    type: Number,
    default: 5000
  },
  callback: {
    type: Function,
    default: null
  },
  ...variants
})

const emit = defineEmits(['close'])

let timer: any = null
const remaining = ref(props.timeout)

const progressBarStyle = computed(() => {
  const remainingPercent = remaining.value / props.timeout * 100
  return { width: `${remainingPercent || 0}%` }
})

const iconName = computed(() => {
  return props.type === 'info'
    ? 'heroicons-outline:information-circle'
    : props.type === 'success'
      ? 'heroicons-outline:check-circle'
      : props.type === 'error'
        ? 'heroicons-outline:x-circle'
        : 'heroicons-outline:exclamation-circle'
})

function onMouseover () {
  if (timer) {
    timer.pause()
  }
}

function onMouseleave () {
  if (timer) {
    timer.resume()
  }
}

function onClose () {
  if (timer) {
    timer.stop()
  }

  if (props.callback) {
    props.callback()
  }

  emit('close')
}

onMounted(() => {
  if (!props.timeout) {
    return
  }

  timer = useTimer(() => {
    onClose()
  }, props.timeout)

  watchEffect(() => {
    remaining.value = timer.remaining.value
  })
})

onUnmounted(() => {
  if (timer) {
    timer.stop()
  }
})
</script>

<template>
  <div class="app-notification" @mouseover="onMouseover" @mouseleave="onMouseleave">
    <div class="notification">
      <div v-if="timeout" class="timeout">
        <div :style="progressBarStyle" />
      </div>
      <div class="flex-shrink-0 icon-notification">
        <Icon :name="iconName" />
      </div>
      <div class="content">
        <h6>
          {{ title }}
        </h6>
        <p v-if="description" class="description">
          {{ description }}
        </p>
      </div>
      <div class="action">
        <button class="button-close" @click.stop="onClose">
          <span class="sr-only">Close</span>
          <Icon name="heroicons-solid:x" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="ts" scoped>
css({
  '.app-notification': {
    zIndex: 50,
    width: '{size.full}',
    pointerEvents: 'auto',
    shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    position: 'relative',

    '.notification': {
      borderRadius: '{radii.md}',
      borderWidth: '0.1px',
      borderColor: '{color.gray.300}',
      position: 'relative',
      overflow: 'hidden',
      padding: '{size.16}',
      width: '100%',
      display: 'flex',
      gap: '{size.8}',

      backgroundColor: (props) => {
      return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.600}` : props.backgroundColor
    },

    '@dark': {
      borderColor: '{color.gray.700}',
      backgroundColor: (props) => {
        return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.700}` :
          props.backgroundColor === 'white' ? '{color.gray.900}' : props.backgroundColor === 'black' ? 'white' : props.backgroundColor
      },
    },

      '> .icon-notification': {
        '.icon': {
          width: '{size.24}',
          height: '{size.24}'
        }
      },

      '.content': {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '{size.4}',
        alignItems: 'center',

        '&:has(.description)': {
          alignItems: 'flex-start !important'
        },

        'h6': {
          fontSize: '{fontSize.sm}',
          fontWeight: '{fontWeight.extrabold}',
          color: '{color.gray.900}',

          '@dark': {
            color: '{color.gray.100}'
          }
        },

        '.description': {
          marginTop: '{size.1}',
          fontSize: '{fontSize.sm}',
          lineHeight: '{lead.5}',
          color: '{color.gray.100}.500'
        },
      },
      '.action': {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'flex-start',

        '.button-close': {
          transition: 'all 0.15',
          color: '{color.gray.400}',

          '@dark': {
            color: '{color.gray.500}',
          },

          '&:hover': {
            color: '{color.gray.500}',

            '@dark': {
              color: '{color.gray.400}',
            }
          },

          '&:focus': {
            outline: 'none',
            color: '{color.gray.500}',

            '@dark': {
              color: '{color.gray.400}',
            }
          },
          '&:deep(svg)': {
            height: '{size.20}',
            width: '{size.20}',
          }
        },
      },
      '.timeout': {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '{size.4}',

        'div': {
          height: '{size.4}',
          background: '{color.primary.500}'
        }
      }
    },
  },

  variants: {
    type: {
      info: {
        '.icon-notification': {
          '.icon': {
            color: '{color.blue.500}'
          }
        }
      },
      success: {
        '.icon-notification': {
          '.icon': {
            color: '{color.green.500}'
          }
        }
      },
      error: {
        '.icon-notification': {
          '.icon': {
            color: '{color.red.500}'
          }
        }
      },
      danger: {
        '.icon-notification': {
          '.icon': {
            color: '{color.orange.500}'
          }
        }
      }
    }
  }
})
</style>
