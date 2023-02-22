<template>
  <div class="app-input-wrapper">
    <input
      :id="name"
      ref="input"
      class="app-input"
      :type="type"
      :name="name"
      :value="modelValue"
      :required="required"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      @input="onInput(($event.target as any).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    >
    <slot />
    <div v-if="(icon || loading) && !trailing" class="icon-leading-wrapper">
      <Icon v-if="icon" :name="loading ? 'line-md:loading-twotone-loop' : icon" class="icon-leading" />
    </div>
    <div v-if="(icon || loading) && trailing" class="icon-trailing-wrapper">
      <Icon v-if="icon" :name="loading ? 'line-md:loading-twotone-loop' : icon" class="icon-trailing" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: null
  },
  spellcheck: {
    type: Boolean,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'text'
  },
  ...variants
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const input = ref<HTMLInputElement | null>(null)

const autoFocus = () => {
  if (props.autofocus) {
    input.value?.focus()
  }
}

const onInput = (value: string) => {
  emit('update:modelValue', value)
}

onMounted(() => {
  setTimeout(() => {
    autoFocus()
  }, 100)
})
</script>

<style lang="ts" scoped>
css({
  '.app-input-wrapper': {
    '--input-padding': (props) => `{size.${props.icon || props.loading ? ['xxs', 'xs'].includes(props.size) ? '28' : '40' : '0'}}`,
    '--input-font-size': (props) => `{fontSize.${['xxs', 'xs'].includes(props.size) ? 'xs' : ['sm', 'md'].includes(props.size) ? 'sm' : 'base'}}`,
    '--input-icon-margin': (props) => `{size.${['xxs', 'sm', 'md'].includes(props.size) ? '12' : '16'}}`,
    '--input-icon-size': (props) => `{size.${props.size === 'xxs' ? '12' : props.size === 'xs' ? '16' : '20'}}`,

    position: 'relative',
    '> .app-input': {
      position: 'relative',
      display: 'block',
      width: '{size.full}',
      fontSize: '{input.font.size}',

      '&:disabled': {
        cursor: 'not-allowed',

        opacity: '0.75'
      },
    },

    '> div': {
      position: 'absolute',
      top: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'none',

      '.icon': {
        width: '{input.icon.size}',
        height: '{input.icon.size}'
      }
    },

    '> .icon-leading-wrapper': {
      '.icon': {
        marginLeft: '{input.icon.margin}'
      }
    },

    '> .icon-trailing-wrapper': {
      marginRight: '{input.icon.margin}'
    }
  },

  variants: {
    appearance: {
      base: {
        '> div': {
          '> .icon': {
            color: '{color.gray.400}',
            '@dark': {
              color: '{color.gray.500}',
            }
          },
        },
        '> .app-input': {
          borderRadius: '{radii.md}',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          borderColor: '{color.gray.200}',
          backgroundColor: '{color.white}',

          '&:focus': {
            ring: '-1px',
            ringOffSetColor: '{color.white} !important',
            borderColor: '{color.transparent}',
            ringColor: '{color.gray.900} !important',
          },

          '@dark': {
            borderColor: '{color.gray.800}',
            backgroundColor: '{color.gray.900}',

            '&:focus': {
              ring: '-1px',
              borderColor: '{color.transparent}',
              ringOffSetColor: '{color.gray.100} !important',
              ringColor: '{color.gray.100} !important',
            }
          },
        }
      },
      invert: {
        '> div': {
          '> .icon': {
            color: '{color.gray.400}',
          },
        },
        '> .app-input': {
          backgroundColor: '{color.gray.900}',
          color: '{color.white}',
          borderColor: '{color.gray.900}',
          borderRadius: '{radii.lg}',
          shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

          '&:focus': {
            ringOffsetColor: '{color.gray.900} !important',
            ringColor: '{color.white} !important'
          },

          '@dark': {
            backgroundColor: '{color.white}',
            color: '{color.black}',
            borderColor: '{color.gray.100}',

            '&:focus': {
              ringOffsetColor: '{color.gray.100} !important',
              ringColor: '{color.black} !important'
            }
          },
        }
      },
      options: {
        default: 'base'
      }
    },
    size: {
      'xxs': {
        '> .app-input': {
          px: '{size.4}',
          py: '{size.2}',
        },
      },
      'xs': {
        '> .app-input': {
          px: '{size.4}',
          py: '{size.2}',
        },
      },
      'sm': {
        '> .app-input': {
          lineHeight: '{lead.4} !important',
          px: '{size.12}',
          py: '{size.8}',
        }
      },
      'md': {
        '> .app-input': {
          px: '{size.16}',
          py: '{size.8}',
          lineHeight: '{lead.5} !important',
        }
      },
      'lg': {
        '> .app-input': {
          px: '{size.16}',
          py: '{size.8}',
          lineHeight: '{lead.6} !important',
        },
      },
      'xl': {
        '> .app-input': {
          px: '{size.24}',
          py: '{size.12}',
          lineHeight: '{lead.7} !important',
        },
      },
      options: {
        default: 'md'
      }
    },
    trailing: {
      false: {
        '&:has(div)': {
          '.app-input': {
            paddingLeft: '{input.padding} !important'
          },
        },
        '> .icon-leading-wrapper': {
          left: 0,
        }
      },
      true: {
        '&:has(div)': {
          '> .app-input': {
            paddingRight: '{input.padding} !important'
          },
        },
        '> .icon-trailing-wrapper': {
          right: 0
        }
      },
      options: {
        default: false
      }
    }
  }
})
</style>
