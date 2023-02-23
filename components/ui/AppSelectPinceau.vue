<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PropType, ComponentPublicInstance } from 'vue'
import { defu } from 'defu'
import {
  Combobox,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  ComboboxInput
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
    default: () => 'uil:angle-down'
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
    default: () => uiPreset.selectCustom.list.option.icon.name
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

const queryOption = computed(() => {
  return query.value === '' ? null : { [props.textAttribute]: query.value }
})

watch(container, (value) => {
  if (value) {
    emit('open')
  } else {
    emit('close')
  }
})

function resolveOptionClass ({ active, selected, disabled }: { active: boolean, selected: boolean, disabled?: boolean }) {
  return classNames(
    props.listOptionBaseClass,
    active ? props.listOptionActiveClass : props.listOptionInactiveClass,
    selected ? props.listOptionSelectedClass : props.listOptionUnselectedClass,
    disabled && props.listOptionDisabledClass
  )
}

function resolveOptionIconClass ({ active }: { active: boolean }) {
  return classNames(
    props.listOptionIconBaseClass,
    active ? props.listOptionIconActiveClass : props.listOptionIconInactiveClass
  )
}

function onUpdate (event: any) {
  if (query.value && searchInput.value?.$el) {
    query.value = ''
    // explicitly set input text because `ComboboxInput` `displayValue` is not reactive
    searchInput.value.$el.value = ''
  }
  emit('update:modelValue', event)
}
</script>

<template>
  <Combobox
    v-slot="{ open }"
    :by="by"
    :model-value="modelValue"
    :multiple="multiple"
    :nullable="nullable"
    :disabled="disabled"
    class="app-select !important"
    as="div"
    @update:model-value="onUpdate"
  >
    <input :value="modelValue" :required="required" tabindex="-1">

    <ComboboxButton ref="trigger" v-slot="{ disabled: buttonDisabled }" as="div" class="combobox-button-container">
      <slot :open="open" :disabled="buttonDisabled">
        <button :disabled="disabled" type="button" class="combobox-button">
          <slot name="label">
            <span v-if="modelValue" class="label">{{ (modelValue as any)[textAttribute] }}</span>
            <span v-else class="place-holder">{{ placeholder }}</span>
          </slot>
          <slot name="icon">
            <span class="icon-wrapper">
              <Icon v-if="icon" :name="icon" aria-hidden="true" />
            </span>
          </slot>
        </button>
      </slot>
    </ComboboxButton>

    <div v-if="open" ref="container" class="combobox-list">
      <transition appear v-bind="listTransitionClass">
        <ComboboxOptions class="combobox-options">
          <ComboboxInput
            v-if="searchable"
            ref="searchInput"
            :display-value="() => query"
            name="q"
            placeholder="Search..."
            autofocus
            autocomplete="off"
            @change="query = $event.target.value"
          />
          <ComboboxOption
            v-for="(option, index) in filteredOptions"
            v-slot="{ active, selected, disabled: optionDisabled }"
            :key="index"
            as="template"
            :value="option"
            :disabled="option.disabled"
          >
            <li :class="resolveOptionClass({ active, selected, disabled: optionDisabled })">
              <div :class="listOptionContainerClass">
                <slot name="option" :option="option" :active="active" :selected="selected">
                  <span class="block truncate">{{ option[textAttribute] }}</span>
                </slot>
              </div>

              <span v-if="selected" :class="resolveOptionIconClass({ active })">
                <Icon v-if="listOptionIcon" :name="listOptionIcon" class="list-option-icon" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>

          <ComboboxOption
            v-if="creatable && queryOption && !filteredOptions.length"
            v-slot="{ active, selected }"
            :value="queryOption"
            as="template"
          >
            <li :class="resolveOptionClass({ active, selected })">
              <div :class="listOptionContainerClass">
                <slot name="option-create" :option="queryOption" :active="active" :selected="selected">
                  <span class="option-create-text">Create "{{ queryOption[textAttribute] }}"</span>
                </slot>
              </div>
            </li>
          </ComboboxOption>
          <p v-else-if="searchable && query && !filteredOptions.length" :class="listOptionEmptyClass">
            <slot name="option-empty" :query="query">
              No results found for "{{ query }}".
            </slot>
          </p>
        </ComboboxOptions>
      </transition>
    </div>
  </Combobox>
</template>

<style lang="ts">
css({
  '.app-select': {
    display: 'relative',
    minWidth: '144px',

    '> input': {
      position: 'absolute',
      inset: 0,
      width: '{size.1}',
      opacity: '0',
      cursor: 'default'
    },

    '.combobox-button-container': {
      display: 'inline-flex',
      width: '{size.full}',

      '.combobox-button': {
        '--select-font-size': (props) => `{fontSize.${['xxs', 'xs'].includes(props.size) ? 'xs' : ['sm', 'md'].includes(props.size) ? 'sm' : 'base'}}`,

        position: 'relative',
        display: 'block',
        width: '{size.full}',
        fontSize: '{select.font.size}',
        borderWidth: '1px',
        paddingRight: (props) => `{size.${props.icon ? ['xxs', 'xs'].includes(props.size) ? '28' : '40' : '0'}}`,

        '&:disabled': {
          cursor: 'not-allowed',
          opacity: '0.75',
        },

        '&:focus': {
          outline: 'none'
        },

        '.label, .place-holder': {
          display: 'block',
          textAlign: 'left',
          lineClamp: 1,
          wordBreak: 'break-all',
        },

        '.place-holder': {
          color: '{color.gray.400}',
          '@dark': {
            color: '{color.gray.600}',
          }
        },

        '.icon-wrapper': {
          '--select-icon-size': (props) => `{size.${props.size === 'xxs' ? '12' : props.size === 'xs' ? '16' : '20'}}`,

          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',

          '> .icon': {
            marginRight: '{size.8}',
            width: '{select.icon.size}',
            height: '{select.icon.size}'
          }
        }
      },
    },

    '.combobox-list': {
        zIndex: 2,
        width: 'auto',
        minWidth: '144px',
        backgroundColor: '{color.white}',

        '@dark': {
          color: '{color.gray.900}'
        },

      '> ul': {
        color: '{color.white}',
        borderRadius: '{radii.md}',
        ring: '-2px',
        ringOffsetColor: '{color.transparent}',
        ringColor: '{color.gray.200}',
        borderWidth: '{size.1}',
        borderColor: '{color.transparent}',
        overflowY: 'auto',
        padding: '{size.4}',
        maxHeight: '240px',

        '@dark': {
          color: '{color.gray.900}',
          ringColor: '{color.gray.800}',
        },

        '> li': {
          position: 'relative',
          display: 'block',
          width: '{size.full}',
          fontSize: '{fontSize.sm}',
          color: '{color.gray.700}',
          px: '{size.16}',
          py: '{size.8}',
          borderLeftWidth: '{size.0}',
          borderTopWidth: '{size.0}',
          borderRightWidth: '{size.0}',
          borderBottomSize: '{size.1}',
          backgroundColor: '{color.white}',
          borderColor: '{color.gray.200}',

          '@dark': {
            color: '{color.gray.300}',
            backgroundColor: '{color.black}',
            borderColor: '{color.gray.800}'
          },

          '&:hover': {
            backgroundColor: '{color.gray.100}',

            '@dark': {
              backgroundColor: '{color.gray.900}',
            }
          },

          '&:focus:': {
            ringColor: '{color.transparent}',
            ringOffsetColor: '{color.transparent}',
            borderColor: '{color.gray.200}',

            '@dark': {
              borderColor: '{color.gray.800}',
            }
          }
        }
      },
    },

    '.option-create-text': {
      display: 'block',
        textAlign: 'left',
        lineClamp: 1,
        wordBreak: 'break-all',
      },
  },

  variants: {
    size: {
      'xxs': {
        '.combobox-button': {
          px: '{size.4}',
          py: '{size.2}',
        },
      },
      'xs': {
        '.combobox-button': {
          px: '{size.4}',
          py: '{size.2}',
        },
      },
      'sm': {
        '.combobox-button': {
          lineHeight: '{lead.4} !important',
          px: '{size.12}',
          py: '{size.8}',
        }
      },
      'md': {
        '.combobox-button': {
          px: '{size.16}',
          py: '{size.8}',
          lineHeight: '{lead.5} !important',
        }
      },
      'lg': {
        '.combobox-button': {
          px: '{size.16}',
          py: '{size.8}',
          lineHeight: '{lead.6} !important',
        },
      },
      'xl': {
        '.combobox-button': {
          px: '{size.24}',
          py: '{size.12}',
          lineHeight: '{lead.7} !important',
        },
      },
      options: {
        default: 'md'
      }
    },
    appearance: {
      base: {
        '.icon': {
          color: '{color.gray.400}',
          '@dark': {
            color: '{color.gray.500}',
          }
        },

        '.combobox-button': {
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
        '.icon': {
          color: '{color.gray.400}',
        },
        '.combobox-button': {
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
    }
  }
})
</style>
