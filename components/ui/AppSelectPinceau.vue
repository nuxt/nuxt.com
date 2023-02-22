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
    default: () => uiPreset.selectCustom.icon.name
  },
  appearance: {
    type: String,
    default: 'default',
    validator (value: string) {
      return Object.keys(uiPreset.selectCustom.appearance).includes(value)
    }
  },
  listBaseClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.base
  },
  listContainerClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.container
  },
  listWidthClass: {
    type: String,
    default: () => uiPreset.selectCustom.list.width
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

const selectCustomClass = computed(() => {
  return classNames(
    uiPreset.selectCustom.appearance[props.appearance]
  )
})

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
    class="app-select"
    as="div"
    @update:model-value="onUpdate"
  >
    <input :value="modelValue" :required="required" tabindex="-1">

    <ComboboxButton ref="trigger" v-slot="{ disabled: buttonDisabled }" as="div" class="combobox-button-container">
      <slot :open="open" :disabled="buttonDisabled">
        <button :class="selectCustomClass" :disabled="disabled" type="button" class="combobox-button">
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

    <div v-if="open" ref="container" :class="[listContainerClass, listWidthClass]">
      <transition appear v-bind="listTransitionClass">
        <ComboboxOptions static :class="listBaseClass">
          <ComboboxInput
            v-if="searchable"
            ref="searchInput"
            :display-value="() => query"
            name="q"
            placeholder="Search..."
            autofocus
            autocomplete="off"
            :class="listInputClass"
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
                <Icon v-if="listOptionIcon" :name="listOptionIcon" :class="listOptionIconSizeClass" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>

          <ComboboxOption v-if="creatable && queryOption && !filteredOptions.length" v-slot="{ active, selected }" :value="queryOption" as="template">
            <li :class="resolveOptionClass({ active, selected })">
              <div :class="listOptionContainerClass">
                <slot name="option-create" :option="queryOption" :active="active" :selected="selected">
                  <span class="block truncate">Create "{{ queryOption[textAttribute] }}"</span>
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

<style lang="ts" scoped>
css({
  '.app-select': {
    '--select-button-padding': (props) => `{size.${props.icon ? ['xxs', 'xs'].includes(props.size) ? '28' : '40' : '0'}}`,
    '--select-font-size': (props) => `{fontSize.${['xxs', 'xs'].includes(props.size) ? 'xs' : ['sm', 'md'].includes(props.size) ? 'sm' : 'base'}}`,
    '--select-icon-size': (props) => `{size.${props.size === 'xxs' ? '12' : props.size === 'xs' ? '16' : '20'}}`,

    display: 'relative',

    '> input': {
      position: 'absolute',
      inset: 0,
      width: '{size.1}',
      opacity: '0',
      cursor: 'default'
    },

    '.combobox-button-container': {
      inline: 'flex',
      width: '{size.full}',

      '.combobox-button': {
        position: 'relative',
        display: 'block',
        width: '{size.full}',
        fontSize: '{select.font.size}',

        '&:disabled': {
          cursor: 'not-allowed',
          opacity: '0.75',
        },

        '&:focus': {
          outline: 'none'
        },

        '.label .place-holder': {
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
    }
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
  }
})
</style>
