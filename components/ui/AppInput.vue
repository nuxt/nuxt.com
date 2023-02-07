<template>
  <div :class="wrapperClass">
    <input
      :id="name"
      ref="input"
      :name="name"
      :value="modelValue"
      :type="type"
      :required="required"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      :class="inputClass"
      @input="onInput(($event.target as any).value)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    >
    <slot />
    <div v-if="isLeading" :class="iconLeadingWrapperClass">
      <Icon v-if="iconName" :name="iconName" :class="iconClass" />
    </div>
    <div v-if="isTrailing" :class="iconTrailingWrapperClass">
      <Icon v-if="iconName" :name="iconName" :class="iconClass" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { classNames } from '../../utils'
import { uiPreset } from '../../ui/preset'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
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
  loadingIcon: {
    type: String,
    default: () =>  uiPreset.input.icon.loading
  },
  trailing: {
    type: Boolean,
    default: false
  },
  leading: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator (value: string) {
      return Object.keys(uiPreset.input.size).includes(value)
    }
  },
  wrapperClass: {
    type: String,
    default: () => uiPreset.input.wrapper
  },
  baseClass: {
    type: String,
    default: () => uiPreset.input.base
  },
  iconBaseClass: {
    type: String,
    default: () => uiPreset.input.icon.base
  },
  customClass: {
    type: String,
    default: null
  },
  appearance: {
    type: String,
    default: 'default',
    validator (value: string) {
      return Object.keys(uiPreset.input.appearance).includes(value)
    }
  },
  loading: {
    type: Boolean,
    default: false
  }
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

const isLeading = computed(() => {
  return (props.icon && props.leading) || (props.icon && !props.trailing) || (props.loading && !props.trailing)
})

const isTrailing = computed(() => {
  return (props.icon && props.trailing) || (props.loading && props.trailing)
})

const inputClass = computed(() => {
  return classNames(
    props.baseClass,
    uiPreset.input.size[props.size],
    uiPreset.input.spacing[props.size],
    uiPreset.input.appearance[props.appearance],
    isLeading.value && uiPreset.input.leading.spacing[props.size],
    isTrailing.value && uiPreset.input.trailing.spacing[props.size],
    props.customClass
  )
})

const iconName = computed(() => {
  if (props.loading) {
    return props.loadingIcon
  }

  return props.icon
})

const iconClass = computed(() => {
  return classNames(
    props.iconBaseClass,
    uiPreset.input.icon.size[props.size],
    isLeading.value && uiPreset.input.icon.leading.spacing[props.size],
    isTrailing.value && uiPreset.input.icon.trailing.spacing[props.size],
    props.loading && 'animate-spin'
  )
})

const iconLeadingWrapperClass = uiPreset.input.icon.leading.wrapper
const iconTrailingWrapperClass = uiPreset.input.icon.trailing.wrapper
</script>
