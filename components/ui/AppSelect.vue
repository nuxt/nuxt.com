<template>
  <Combobox
    v-slot="{ open }"
    :by="by"
    class="app-select"
    :model-value="modelValue"
    :multiple="multiple"
    :nullable="nullable"
    :disabled="disabled"
    as="div"
    @update:model-value="onUpdate"
  >
    <input :value="modelValue" :required="required" tabindex="-1">

    <ComboboxButton ref="trigger" v-slot="{ disabled: buttonDisabled }" as="div" class="app-select-button">
      <slot :open="open" :disabled="buttonDisabled">
        <button :disabled="disabled" type="button">
          <slot name="label">
            <span v-if="modelValue" class="label">{{ (modelValue as any)[textAttribute] }}</span>
            <span v-else class="label">{{ placeholder }}</span>
          </slot>
          <slot name="icon">
            <span class="icon-wrapper">
              <Icon v-if="icon" name="uil:angle-down" aria-hidden="true" />
            </span>
          </slot>
        </button>
      </slot>
    </ComboboxButton>

    <div v-if="open" ref="container" class="app-select-list">
      <transition appear>
        <ComboboxOptions static class="app-select-list-options">
          <ComboboxOption
            v-for="(option, index) in filteredOptions"
            v-slot="{ active, selected, disabled }"
            :key="index"
            as="template"
            :value="option"
            :disabled="option.disabled"
          >
            <li>
              <div
                :style="`font-weight: ${selected ? '600' : '500'}; opacity: ${disabled ? '0.5;' : '1;'}; cursor: ${disabled ? 'not-allowed;' : 'default;'}`"
              >
                <slot name="option" :option="option" :active="active" :selected="selected">
                  <span class="option-label">{{ option[textAttribute] }}</span>
                </slot>
              </div>

              <span v-if="selected">
                <Icon v-if="listOptionIcon" :name="listOptionIcon" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </transition>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PropType, ComponentPublicInstance } from 'vue'
import { defu } from 'defu'
import {
  Combobox,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption
} from '@headlessui/vue'
import { classNames } from '../../utils'
import { uiPreset } from '../../ui/preset'
import type { PopperOptions } from 'types'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object, Array],
    default: ''
  },
  by: {
    type: String,
    default: undefined
  },
  options: {
    type: Array as PropType<{ [key: string]: any, disabled?: boolean }[]>,
    default: () => []
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  nullable: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  creatable: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  icon: {
    type: String,
    default: 'uil:angle-down'
  },
  customClass: {
    type: String,
    default: null
  },
  listInputClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.input
  },
  listTransitionClass: {
    type: Object,
    default: () => uiPreset.selectCustom.list.transition
  },
  listOptionBaseClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.base
  },
  listOptionContainerClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.container
  },
  listOptionActiveClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.active
  },
  listOptionInactiveClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.inactive
  },
  listOptionSelectedClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.selected
  },
  listOptionUnselectedClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.unselected
  },
  listOptionDisabledClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.disabled
  },
  listOptionEmptyClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.empty
  },
  listOptionIcon: {
    type: String,
    default: 'uil:check'
  },
  listOptionIconBaseClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.icon.base
  },
  listOptionIconActiveClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.icon.active
  },
  listOptionIconInactiveClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.icon.inactive
  },
  listOptionIconSizeClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.option.icon.size
  },
  textAttribute: {
    type: String,
    default: 'text'
  },
  searchAttributes: {
    type: Array,
    default: null
  },
  popperOptions: {
    type: Object as PropType<PopperOptions>,
    default: () => ({})
  },
  ...variants
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const popperOptions = computed<PopperOptions>(() => defu({}, props.popperOptions, uiPreset.selectCustom.popperOptions))

const [trigger, container] = usePopper(popperOptions.value)

const query = ref('')
const searchInput = ref<ComponentPublicInstance<HTMLElement>>()

const filteredOptions = computed(() =>
  query.value === ''
    ? props.options
    : props.options.filter((option: any) => {
      return (props.searchAttributes?.length ? props.searchAttributes : [props.textAttribute]).some((searchAttribute: any) => {
        return option[searchAttribute] && option[searchAttribute].search(new RegExp(query.value, 'i')) !== -1
      })
    })
)

watch(container, (value) => {
  if (value) {
    emit('open')
  } else {
    emit('close')
  }
})

function onUpdate (event: any) {
  if (query.value && searchInput.value?.$el) {
    query.value = ''
    // explicitly set input text because `ComboboxInput` `displayValue` is not reactive
    searchInput.value.$el.value = ''
  }
  emit('update:modelValue', event)
}
</script>

<style lang="ts" scoped>
css({
  '.app-select': {
    position: 'relative',

    '> input': {
      position: 'absolute',
      inset: 0,
      opacity: 0,
      cursor: 'default',
      width: '{size.0}'
    },

    '.app-select-button': {
      display: 'inline-flex',
      width: '{size.full}',

      '> button': {
        position: 'relative',
        display: 'block',
        width: '{size.full}',
        textAlign: 'left',
        cursor: 'default',
        paddingRight: '{size.40}',
        fontSize: '{fontSize.sm}',

        '&:disabled': {
          cursor: 'not-allowed',
          opacity: '0.75',
          outline: 'none'
        },

        '.label': {
          textAlign: 'left',
          lineClamp: 1,
          wordBreak: 'break-all',
          color: (props) => `color: ${props.modelValue ? '{color.gray.400}' : '{color.current}'}`,

          '@dark': {
            color: (props) => `color: ${props.modelValue ? '{color.gray.600}' : '{color.current}'}`
          }
        },

        '.icon-wrapper': {
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',

          '.icon': {
            marginRigth: '{size.8}',
            color: '{color.gray.400}',
            height: '{size.20}',
            width: '{size.20}',
            marginRight: (props) => `{size.${props.size === 'sm' ? '8' : '12'}}`,

            '@dark': {
              color: '{color.gray.600}'
            }
          }
        }
      }
    },
    '.app-select-list': {
      zIndex: 20,

      '.app-select-list-options': {
        backgroundColor: '{color.white}',
        borderRadius: '{radii.md}',
        ring: '{size.0}',
        ringOffset: '{size.1}',
        ringOffsetColor: '{color.gray.200}',
        borderWidth: '{size.0}',
        borderColor: '{color.transparent}',
        overflowY: 'auto',
        padding: '{size.4}',
        maxHeight: '240px',
        width: '{size.full}',

        '@dark': {
          ringOffsetColor: '{color.gray.800}'
        },

        '> li': {
          cursor: 'default',
          userSelect: 'none',
          position: 'relative',
          py: '{size.6}',
          paddingLeft: '{size.8}',
          paddingRight: '{size.32}',
          borderRadius: '{radii.md}',
          fontSize: '{fontSize.sm}',

          '&:hover': {
            color: '{color.gray.900}',
            backgroundColor: '{color.gray.100}',

            '@dark': {
              color: '{color.gray.100}',
              backgroundColor: '{color.gray.900}',
            }
          },

          '> div > span': {
            textAlign: 'left',
            lineClamp: 1,
            wordBreak: 'break-all',
            display: 'block',
          },

          '> span': {
            top: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            paddingRight: '{size.8}',

            '.icon': {
              width: '{size.16}',
              height: '{size.16}',
            }
          }
        }
      }
    }
  },

  variants: {
    appearance: {
      base: {
        '.app-select-button': {
          '> button': {
            backgroundColor: '{color.white}',
            borderWidth: '{size.1}',
            borderColor: '{color.gray.200}',
            borderRadius: '{radii.md}',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',

            '@dark': {
              backgroundColor: '{color.gray.900}',
              borderColor: '{color.gray.800}',
            },

            '&:focus': {
              ringOffset: '{size.1}',
              ring: '{size.0}',
              ringOffsetColor: '{color.gray.900}',
              borderColor: '{color.gray.900}',

              '@dark': {
                ringOffsetColor: '{color.gray.100}',
                borderColor: '{color.gray.100}',
              }
            }
          }
        }
      },
      options: {
        default: 'base'
      }
    },
    size: {
      xs: {
        '.app-select-button': {
          '> button': {
            px: '{size.10}',
            py: '{size.6}',
            fontSize: '{fontSize.xs}',
          }
        }
      },
      sm: {
        '.app-select-button': {
          '> button': {
            px: '{size.12}',
            py: '{size.8}',
            fontSize: '{fontSize.sm}',
            lineHeight: '{lead.4}',
          }
        }
      },
      md: {
        '.app-select-button': {
          '> button': {
            px: '{size.16}',
            py: '{size.8}',
            fontSize: '{fontSize.sm}',
          }
        }
      },
      lg: {
        '.app-select-button': {
          '> button': {
            px: '{size.16}',
            py: '{size.8}',
            fontSize: '{fontSize.base}',
          }
        },
      },
      xl: {
        '.app-select-button': {
          '> button': {
            px: '{size.24}',
            py: '{size.12}',
            fontSize: '{fontSize.base}',
          }
        },
      },
      options: {
        default: 'md'
      }
    }
  }
})
</style>

<style lang="postcss">
.v-enter-active {
  transition: 'all ease-in 0.1s';
}

.v-leave-from {
  opacity: 1;
}

.v-leave-to {
  opacity: 0;
}
</style>
