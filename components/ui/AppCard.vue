<template>
  <component :is="$attrs.onSubmit ? 'form' : 'div'" class="app-card" v-bind="$attrs">
    <div v-if="$slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { PinceauTheme } from 'pinceau'
import { computedStyle } from 'pinceau/runtime'

defineProps({
  backgroundColor: computedStyle<keyof PinceauTheme['color']>('white'),
  ...variants
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isColorPalette = (color: any) => {
  return !['white', 'black', 'transparent', 'current'].includes(color.toString())
}
</script>

<style lang="ts" scoped>
css({
  '.app-card': {
    display: 'block',
    overflow: 'hidden',
    zIndex: '0',
    ringOffset: '{size.1}',
    ringColor: '{color.transparent}',
    ringOffsetColor: '{color.gray.200}',

    borderColor: '{color.gray.200}',

    backgroundColor: (props) => {
      return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.600}` : props.backgroundColor
    },

    '@dark': {
      borderColor: '{color.gray.800}',
      backgroundColor: (props) => {
        return isColorPalette(props.backgroundColor) ? `{color.${props.backgroundColor}.700}` :
          props.backgroundColor === 'white' ? '{color.gray.900}' : props.backgroundColor === 'black' ? 'white' : props.backgroundColor
      },
    },

    '> .header': {
      borderColor: '{color.gray.200}',
      borderStyle: 'solid',
      width: '100%',

      '@dark': {
        borderColor: '{color.gray.800}',
      }
    },
    '> .footer': {
      borderColor: '{color.gray.200}',
      borderTopWidth: '{size.1}',

      '@dark': {
        borderColor: '{color.gray.800}',
      }
    }
  },

  variants: {
    headerContentPosition: {
      left: {
        '> .header': {
          justifyContent: 'flex-start'
        }
      },
      center: {
        '> .header': {
          justifyContent: 'center'
        }
      },
      right: {
        '> .header': {
          justifyContent: 'flex-end'
        }
      },
      between: {
        '> .header': {
          justifyContent: 'space-between'
        }
      },
      options: {
        default: 'left'
      }
    },
    rounded: {
      none: {
        borderRadius: '0px'
      },
      sm: {
        borderRadius: '0.125rem'
      },
      base: {
        borderRadius: '0.25rem'
      },
      md: {
        borderRadius: '0.375rem'
      },
      lg: {
        borderRadius: '0.5rem'
      },
      xl: {
        borderRadius: '0.75rem'
      },
      '2xl': {
        borderRadius: '1rem'
      },
      'full': {
        borderRadius: '9999px'
      },
      options: {
        default: 'xl'
      }
    },
    shadow: {
      true: {
        boxShadow: '0 {size.1} {size.3} 0 rgb(0 0 0 / 0.1), 0 {size.1} {size.2} -1px rgb(0 0 0 / 0.1)'
      },
      false: {
        boxShadow: 'none'
      },
      options: {
        default: true
      }
    },
    border: {
      true: {
        borderStyle: 'solid',
        borderWidth: '{size.1}'
      },
      false: {
        border: 'none'
      },
      options: {
        default: true
      }
    },
    headerBorder: {
      true: {
        borderBottomWidth: '{size.1}',
      },
      false: {
        border: 'none',
      },
      options: {
        default: false
      }
    },
    headerBlock: {
      true: {
        '> .header': {
          display: 'block',
        }
      },
      false: {
        '> .header': {
          display: 'flex',
        }
      },
      options: {
        default: false
      }
    },
    headerPadding: {
      true: {
        '> .header': {
          px: '{size.16}',
          paddingTop: '{size.20}',

          '@sm': {
            px: '{size.24}',
          },
        }
      },
      false: {
        '> .header': {
          py: '{size.0}',
          px: '{size.0}',

          '@sm': {
            px: '{size.0}'
          },
        }
      },
      options: {
        default: true
      }
    },
    bodyPadding: {
      true: {
        '> .body': {
          px: '{size.16}',
          py: '{size.20}',

          '@sm': {
            px: '{size.24}'
          },
        }
      },
      false: {
        '> .body': {
          py: '{size.0}',
          px: '{size.0}',

          '@sm': {
            px: '{size.0}'
          },
        }
      },
      options: {
        default: true
      }
    },
    footerPadding: {
      true: {
        '> .footer': {
          px: '{size.16}',
          py: '{size.20}',

          '@sm': {
            px: '{size.24}'
          },
        }
      },
      false: {
        '> .footer': {
          py: '{size.0}',
          px: '{size.0}',

          '@sm': {
            px: '{size.0}'
          },
        }
      },
      options: {
        default: true
      }
    }
  }
})
</style>
