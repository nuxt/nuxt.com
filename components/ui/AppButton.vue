<template>
  <component
    :is="buttonIs"
    ref="button"
    class="app-button"
    :disabled="disabled"
    v-bind="buttonProps"
    :aria-label="ariaLabel"
  >
    <Icon v-if="(icon || loading) && !trailing" :name="loading ? 'line-md:loading-twotone-loop' : icon" aria-hidden="true" class="icon-leading" />
    <span><slot v-if="!label" />{{ label }}</span>
    <Icon v-if="(icon || loading) && trailing" :name="loading ? 'line-md:loading-twotone-loop' : icon" aria-hidden="true" class="icon-trailing" />
  </component>
</template>

<script setup lang="ts">
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import NuxtLink from '#app/components/nuxt-link'
import type { PropType } from 'vue'

const props = defineProps({
  color: computedStyle<keyof PinceauTheme['color']>('blue'),
  to: {
    type: [String, Object] as PropType<string | RouteLocationNormalized | RouteLocationRaw>,
    default: null
  },
  target: {
    type: String,
    default: 'null'
  },
  label: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'button'
  },
  loading: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  },
  trailing: {
    type: Boolean,
    default: false
  },
  ...variants
})

const buttonIs = computed(() => {
  if (props.to) {
    return NuxtLink
  }

  return 'button'
})

const buttonProps = computed(() => {
  if (props.to) {
    return { to: props.to, target: props.target }
  } else {
    return { disabled: props.disabled || props.loading, type: props.type }
  }
})
</script>

<style lang="ts" scoped>
css({
  '.app-button': {
    '--button-base': (props) => `{color.${props.color}.600}`,
    '--button-base-hover': (props) => `{color.${props.color}.500}`,

    position: 'relative',
    alignItems: 'center',
    fontWeight: '{fontWeight.medium}',
    transition: '{transition.background}',

    '&:focus': {
      outline: 'none',
      ringOffset: 2,
      ring: 2,
    },

    '.icon': {
      pointerEvents: 'none',
      flexShrink: 0,
      width: (props) => `{size.${props.size === 'xxs' ? '12' : props.size === 'xs' ? '16' : '20'}}`,
      height: (props) => `{size.${props.size === 'xxs' ? '12' : props.size === 'xs' ? '16' : '20'}}`,
    },

    '.icon-leading': {
      marginRight: (props) => `{size.${['xxs', 'xs', 'sm'].includes(props.size) ? '8' : '12'}}`
    },

    '.icon-trailing': {
      marginLeft: (props) => `{size.${['xxs', 'xs', 'sm'].includes(props.size) ? '8' : '12'}}`
    }
  },

  variants: {
    variant: {
      base: {
        backgroundColor: '{button.base}',
        ringColor: '{button.base}',
        ringOffsetColor: '{color.white}',
        color: '{color.gray.100}',

        '@dark': {
          ringOffsetColor: '{color.black}',
        },

        '&:hover': {
          backgroundColor: '{button.base.hover}',
        },

        '.icon': {
          color: '{color.gray.100}',
        },

        '&:disabled': {
          opacity: '0.75'
        }
      },
      gray: {
        borderWidth: '{size.1}',
        borderColor: '{color.transparent}',
        color: '{color.gray.700}',
        backgroundColor: '{color.gray.100}',
        ringColor: '{color.gray.900}',
        ringOffsetColor: '{color.white}',

        '&:hover': {
          backgroundColor: '{color.gray.200}',
        },

        '&:disabled': {
          opacity: '0.75',
        },

        '@dark': {
          color: '{color.gray.300}',
          backgroundColor: '{color.gray.800}',
          ringColor: '{color.gray.100}',
          ringOffsetColor: '{color.black}',

          '&:hover': {
            backgroundColor: '{color.gray.700}',
          },
        }
      },
      primary: {
        borderWidth: '{size.1}',
        borderColor: '{color.transparent}',
        backgroundColor: '{color.gray.900}',
        ringColor: '{color.gray.900}',
        ringOffsetColor: '{color.white}',
        color: '{color.gray.100}',

        '@dark': {
          backgroundColor: '{color.gray.100}',
          color: '{color.gray.900}',
        },

        '&:disabled': {
          opacity: '0.75',
        },

        '&:hover': {
          backgroundColor: `{color.gray.800}`,

          '@dark': {
            backgroundColor: `{color.gray.200}`,
          }
        },

        '.icon': {
            color: `{color.gray.100}`,
            '@dark': {
              color: `{color.gray.900}`,
            }
        },
      },
      secondary: {
        borderWidth: '{size.1}',
        borderColor: '{color.gray.200}',
        backgroundColor: '{color.white}',
        ringColor: '{color.gray.900}',
        ringOffsetColor: '{color.white}',
        color: '{color.gray.700}',

        '&:hover': {
          backgroundColor: '{color.gray.50}',
          '@dark': {
            backgroundColor: '{color.gray.900}'
          }
        },

        '&:disabled': {
          opacity: '0.75',
        },

        '@dark': {
          borderColor: '{color.gray.800}',
          backgroundColor: '{color.black}',
          color: '{color.gray.300}',
          ringOffsetColor: '{color.black}',
          ringColor: '{color.gray.100}',
        },

        '.icon': {
          color: '{color.gray.700}',
          '@dark': {
            color: '{color.gray.300}'
          }
        }
      },
      'transparent': {
        borderWidth: '{size.1}',
        borderColor: '{color.transparent}',
        color: '{color.gray.900}',
        ringColor: '{color.transparent}',
        ringOffsetColor: '{color.transparent}',

        '&:hover': {
          color: '{color.gray.700}',
          '@dark': {
            color: '{color.gray.300}'
          }
        },

        '&:disabled': {
          opacity: '0.75',
        },

        '@dark': {
          color: '{color.gray.100}',
          ringColor: '{color.transparent}',
          ringOffsetColor: '{color.transparent}',
        }
      },
      'input-group': {
        boxShadow: '{shadow.sm}',
        borderWidth: '{size.1}',
        borderColor: '{color.gray.200}',
        color: '{color.gray.700}',
        backgroundColor: '{color.white}',
        ringColor: '{color.gray.900}',
        ringOffsetColor: '{color.white}',

        '&:focus': {
          borderColor: '{color.gray.900}',
          '@dark': {
            borderColor: '{color.gray.100}'
          }
        },

        '&:disabled': {
          opacity: '0.75',
        },

        '&:hover': {
          backgroundColor: '{color.gray.100}',
          '@dark': {
            backgroundColor: '{color.gray.800}'
          }
        },

        '@dark': {
          borderColor: '{color.gray.800}',
          color: '{color.gray.300}',
          backgroundColor: '{color.gray.900}',
          ringColor: '{color.gray.100}',
          ringOffsetColor: '{color.black}',
        }
      },
      'primary-gradient': {
        ringColor: '{color.green.400}',
        ringOffsetColor: '{color.white}',
        position: 'relative',
        borderRadius: '{radii.md}',
        border: '1px solid transparent',
        backgroundColor: '{color.gray.900}',
        color: '{color.gray.100}',

        '&::before': {
          transition: 'all 0.2s',
          content: `''`,
          position: 'absolute',
          background: 'linear-gradient(to right, #00dc82, #36e4da, #16a79e)',
          inset: '-3px -3px -3px -3px',
          zIndex: -1,
          borderRadius: '9.5px',
        },

        '&:disabled': {
          backgroundColor: '{color.gray.700}',
          '&::before': {
            background: '{color.black}'
          }
        },

        '&:hover': {
          backgroundColor: '{color.black}',
          '&::before': {
            boxShadow: '0 0 10px 0 rgba(0, 220, 130, 0.5), 0 0 20px 0 rgba(54, 228, 218, 0.5)',
          },
          '&:disabled': {
            '&::before': {
              boxShadow: 'none'
            }
          },
        },
      },
      options: {
        default: 'base'
      }
    },
    size: {
      xxs: {
        px: '{size.10}',
        py: '{size.4}',
        fontSize: '{button.fontSize.xs}',

        '.icon-leading': {
          marginRight: '{size.8}'
        },

        '.icon-trailing': {
          marginLeft: '{size.8}'
        }
      },
      xs: {
        px: '{size.10}',
        py: '{size.4}',
        fontSize: '{button.fontSize.xs}',
      },
      sm: {
        px: '{size.12}',
        py: '{size.8}',
        lineHeight: '1rem',
        fontSize: '{button.fontSize.sm}',
      },
      md: {
        px: '{size.16}',
        py: '{size.8}',
        fontSize: '{button.fontSize.md}',
      },
      lg: {
        px: '{size.16}',
        py: '{size.8}',
        fontSize: '{button.fontSize.lg}',
      },
      xl: {
        px: '{size.24}',
        py: '{size.12}',
        fontSize: '{button.fontSize.xl}',
      },
      options: {
        default: 'md'
      }
    },
    block: {
      true: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      },
      false: {
        display: 'inline-flex'
      },
      options: {
        default: false
      }
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
      },
      options: {
        default: false
      }
    },
    rounded: {
      false: {
        borderRadius: '{radii.md}'
      },
      true: {
        borderRadius: '9999px'
      },
      options: {
        default: false
      }
    },
    truncate: {
      true: {
        '> span': {
          textAlign: 'left',
          lineClamp: 1,
          wordBreak: 'break-all'
        }
      },
      options: {
        default: false
      }
    },
  }
})
</style>
