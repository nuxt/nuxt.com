<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import type { PropType } from 'vue'
import { classNames } from '../../utils'
import { uiPreset } from '../../ui/preset'
import type { ToastNotificationAction } from 'types'
import { isColorPalette } from '../../utils'
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: null,
    validator (value: string) {
      return Object.keys(uiPreset.notification.type).includes(value)
    }
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
  shadowClass: {
    type: String,
    default: () => uiPreset.notification.shadow
  },
  ringClass: {
    type: String,
    default: () => uiPreset.notification.ring
  },
  roundedClass: {
    type: String,
    default: () => uiPreset.notification.rounded
  },
  transitionClass: {
    type: Object,
    default: () => uiPreset.notification.transition
  },
  customClass: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  iconBaseClass: {
    type: String,
    default: () => uiPreset.notification.icon.base
  },
  timeout: {
    type: Number,
    default: 5000
  },
  actions: {
    type: Array as PropType<{
      label: string,
      click: Function
    }[]>,
    default: () => []
  },
  callback: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close'])

let timer: any = null
const remaining = ref(props.timeout)

const iconName = computed(() => {
  return props.icon || uiPreset.notification.type[props.type]
})

const iconClass = computed(() => {
  return classNames(
    props.iconBaseClass,
    uiPreset.notification.icon.color[props.type] || 'u-text-gray-400'
  )
})

const progressBarStyle = computed(() => {
  const remainingPercent = remaining.value / props.timeout * 100
  return { width: `${remainingPercent || 0}%` }
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

function onAction (action: ToastNotificationAction) {
  if (timer) {
    timer.stop()
  }

  if (action.click) {
    action.click()
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
  <transition appear v-bind="transitionClass">
    <div
      @mouseover="onMouseover"
      @mouseleave="onMouseleave"
    >
      <div>
          <div>
            <div>
              <h6>
                {{ title }}
              </h6>
              <p v-if="description" class="description">
                {{ description }}
              </p>

              <div v-if="description && actions.length">
                <button v-for="(action, index) of actions" :key="index" type="button" @click.stop="onAction(action)">
                  {{ action.label }}
                </button>
              </div>
            </div>
            <div>
              <div v-if="!description && actions.length">
                <button v-for="(action, index) of actions" :key="index" type="button" @click.stop="onAction(action)">
                  {{ action.label }}
                </button>
              </div>

              <button
                @click.stop="onClose"
              >
                <span class="sr-only">Close</span>
                <Icon name="heroicons-solid:x" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="timeout">
          <div :style="progressBarStyle" />
        </div>
      </div>
  </transition>
</template>


<style lang="ts">
css({
  '.notification': {
    '> div': {
      zIndex: 50,
      width: '{size.full}',
      pointerEvents: 'auto',
      borderRadius: '{radii.lg}',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

      backgroundColor: (props) => {
        return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.600}` : props.backgroundColor
      },

      '@dark': {
        backgroundColor: (props) => {
          return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.700}` :
            props.backgroundColor === 'white' ? '{color.gray.900}' : props.backgroundColor === 'black' ? 'white' : props.backgroundColor
        },
      },

      '&:first-child': {
        position: 'relative',
        overflow: 'hidden',
        ringOffsetColor: '{color.gray.200}',
        ringColor: 'transparent',
        padding: '{size.16}',

        '@dark': {
          ringOffsetColor: '{color.gray.800}',
        },

        '> div': {
          display: 'flex',
          gap: '{size.12}',
          alignItems: 'center',

          '&:has(> .description)': {
            alignItems: 'flex-start'
          },

          '&:first-child': {
            width: '{size.0}',
            flex: '1 1 0%',

            'h6': {
              fontSize: '{fontSize.sm}',
              fontWeight: '{fontWeight.medium}',
              color: '{color.gray.900}',

              '@dark': {
                color: '{color.gray.100}'
              }
            },

            '.description': {
              marginTop: '{size.4}',
              fontSize: '{fontSize.sm}',
              lineHeight: '{lead.5}',
              color: '{color.gray.100}.500'
            },

            'div': {
              marginTop: '{size.12}',
              alignItems: 'center',
              gap: '{size.6}',

              'button': {
                fontSize: '{fontSize.sm}',
                fontWeight: '{fontWeight.medium}',
                color: '{color.gray.500}',

                '@dark': {
                  color: '{color.gray.400}',
                },

                '&:hover': {
                  color: '{color.gray.400}',
                  '@dark': {
                    color: '{color.gray.500}',
                  },
                },

                '&:focus': {
                  outline: 'none'
                }
              }
            }
          },
          '&:last-child': {
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '{size.12}',

            div: {
              display: 'flex',
              alignItems: 'center',
              gap: '{size.8}',

              button: {
                fontSize: '{fontSize.sm}',
                fontWeight: '{fontWeight.medium}',
                color: '{color.gray.500}',

                '@dark': {
                  color: '{color.gray.400}',
                },

                '&:hover': {
                  color: '{color.gray.400}',
                  '@dark': {
                    color: '{color.gray.500}',
                  },
                },

                '&:focus': {
                  outline: 'none'
                }
              }
            },

            'button': {
              transition: 'all 0.15 ease-in-out',
              color: '{color.gray.400}',

                '@dark': {
                  color: '{color.gray.500}',
                },

                '&:hover': {
                  color: '{color.gray.500}',
                },

                '&:focus': {
                  outline: 'none',
                  color: '{color.gray.500}',
                },

                '.icon': {
                  width: '{size.20}',
                  height: '{size.20}'
                },
              },
            },
          },
        },
        '&:last-child': {
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
})
</style>
