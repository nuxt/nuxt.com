<template>
  <component
    :is="buttonIs"
    ref="button"
    class="app-button"
    :disabled="disabled"
    v-bind="buttonProps"
    :aria-label="ariaLabel"
  >
    <Icon v-if="iconName && !trailing" :name="iconName" aria-hidden="true" class="icon-leading" />
    <span><slot /></span>
    <Icon v-if="iconName && trailing" :name="iconName" aria-hidden="true" class="icon-trailing" />
  </component>
</template>

<script setup lang="ts">
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import NuxtLink from '#app/components/nuxt-link'

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
  ariaLabel: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'button'
  },
  iconName: {
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
    },
  },

  variants: {
    variant: {
      base: {
        backgroundColor: '{button.base}',
        color: '{color.gray.100}',
        '&:hover': {
          backgroundColor: '{button.base.hover}',
        },

        '@dark': {
          color: '{color.gray.900}',
        },

        '.icon': {
          color: '{color.gray.900}',
          '@dark': {
            color: '{color.gray.100}'
          }
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
        color: '{color.gray.500}',
        ringColor: '{color.gray.700}',
        ringOffsetColor: '{color.white}',

        '&:hover': {
          color: '{color.gray.700}',
          '@dark': {
            color: '{color.gray.300}'
          }
        },

        '@dark': {
          color: '{color.gray.400}',
          ringColor: '{color.gray.300}',
          ringOffsetColor: '{color.black}',
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

      //before:bg-gradient-to-r before:from-green-400 before:via-teal-400 before:to-teal-600 before:blur-md before:z-[-1]
      'primary-gradient': {
        ringColor: '{color.green.400}',
        ringOffsetColor: '{color.white}',
        position: 'relative',
        borderRadius: '{radii.lg}',
        border: '2px solid transparent',
        padding: '10px 20px',
        backgroundColor: 'black',
        color: '{color.gray.100}',

        '&::before': {
          transition: 'all 0.2s',
          content: `''`,
          position: 'absolute',
          background: 'linear-gradient(to right, #00dc82, #36e4da, #16a79e)',
          inset: '-4px',
          zIndex: -1,
          borderRadius: '{radii.lg}',
          blur: '12px'
        },

        '&:hover': {
          '&::before': {
            boxShadow: '0 0 10px 0 rgba(0, 220, 130, 0.5), 0 0 20px 0 rgba(54, 228, 218, 0.5)'
          }
        }
      },
      options: {
        default: 'base'
      }
    },
    size: {
      xxs: {
        px: '{size.10}',
        py: '{size.4}',
        fontSize: '{fontSize.xs}',

        '.icon': {
          width: '{size.12}',
          height: '{size.12}',
        },

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
        fontSize: '{fontSize.xs}',

        '.icon': {
          width: '{size.16}',
          height: '{size.16}'
        },

        '.icon-leading': {
          marginRight: '{size.8}'
        },

        '.icon-trailing': {
          marginLeft: '{size.8}'
        }
      },
      sm: {
        px: '{size.14}',
        py: '{size.8}',
        fontSize: '{fontSize.sm}',

        '.icon': {
          width: '{size.20}',
          height: '{size.20}'
        },

        '.icon-leading': {
          marginRight: '{size.8}'
        },

        '.icon-trailing': {
          marginLeft: '{size.8}'
        }
      },
      md: {
        px: '{size.16}',
        py: '{size.8}',
        fontSize: '{fontSize.base}',

        '.icon': {
          width: '{size.20}',
          height: '{size.20}'
        },

        '.icon-leading': {
          marginRight: '{size.12}'
        },

        '.icon-trailing': {
          marginLeft: '{size.12}'
        }
      },
      lg: {
        px: '{size.16}',
        py: '{size.8}',
        fontSize: '{fontSize.lg}',

        '.icon': {
          width: '{size.20}',
          height: '{size.20}'
        },

        '.icon-leading': {
          marginRight: '{size.12}'
        },

        '.icon-trailing': {
          marginLeft: '{size.12}'
        }
      },
      xl: {
        px: '{size.24}',
        py: '{size.12}',
        fontSize: '{fontSize.xl}',

        '.icon': {
          width: '{size.20}',
          height: '{size.20}'
        },

        '.icon-leading': {
          marginRight: '{size.12}'
        },

        '.icon-trailing': {
          marginLeft: '{size.12}'
        }
      },
      options: {
        default: 'sm'
      }
    },
    block: {
      true: {
        widht: '100%',
        display: 'flex',
        justifyContent: 'center',
      },
      false: {
        display: 'inline-flex'
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
        cursor: 'not-allowed',
        opacity: '.75'
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
