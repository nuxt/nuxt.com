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
  color: computedStyle<keyof PinceauTheme['color']>('white'),
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
    position: 'relative',
    fontWeight: '{ fontWeight.medium }',
    alignItems: 'center',
    fontWeight: 500,

    '&:focus': {
      outline: 'none',
      ringOffset: 2,
      ring: 2,
    },

    '.icon': {
      pointerEvents: 'none',
      flexShrink: 0
    },
  },

  variants: {
    variant: {
      base: {
        //backgroundColor: (props) => `{color.${props.color}.500}`,
        '&:hover': {
          //backgroundColor: (props) => `{color.${props.color}.400}`,
        },
        '.icon': {
          //color: (props) => `{color.${props.color}.100}`,
        }
      },
      primary: {
        borderWidth: '{size.1}',
        borderColor: '{color.transparent}',
        backgroundColor: '{color.gray.900}',
        ringColor: '{color.gray.900}',
        ringOffsetColor: '{color.white}',

        '&:hover': {
          backgroudColor: '{color.gray.800}',
        },

        '> span': {
          color: '{color.gray.100}',
        },

        '.icon': {
            color: '{color.gray.100}',
        },

        '@dark': {
          color: '{color.white}',
          backgroundColor: '{color.gray.100}',
          ringOffsetColor: '{color.black}',
          ringColor: '{color.gray.100}',

          '&:hover': {
            backgroudColor: '{color.gray.200}',
          },

          '> span': {
            color: '{color.gray.900}',
          },

          '.icon': {
            color: '{color.gray.900}',
          },
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
    trailing: {
      true: {

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
