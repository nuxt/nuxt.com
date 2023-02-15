<template>
  <component
    :is="buttonIs"
    ref="button"
    :class="buttonClass"
    :aria-label="ariaLabel"
    v-bind="buttonProps"
  >
    <Icon v-if="isLeading && leadingIconName" :name="leadingIconName" :class="leadingIconClass" aria-hidden="true" />

    <slot><span :class="truncate ? 'text-left break-all line-clamp-1' : ''">{{ label }}</span></slot>

    <Icon v-if="isTrailing && trailingIconName" :name="trailingIconName" :class="trailingIconClass" aria-hidden="true" />
  </component>
</template>

<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import type { PropType } from 'vue'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import NuxtLink from '#app/components/nuxt-link'
import { uiPreset } from '../../ui/preset'
import { classNames } from '../../utils'

const props = defineProps({
  type: {
    type: String,
    default: 'button'
  },
  block: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>,
    default: 'md'
  },
  variant: {
    type: String,
    default: 'primary',
    validator (value: string) {
      return Object.keys(uiPreset.button.variant).includes(value)
    }
  },
  icon: {
    type: String,
    default: null
  },
  leadingIcon: {
    type: String,
    default: null
  },
  trailingIcon: {
    type: String,
    default: null
  },
  loadingIcon: {
    type: String,
    default: () => uiPreset.button.icon.loading
  },
  trailing: {
    type: Boolean,
    default: false
  },
  leading: {
    type: Boolean,
    default: false
  },
  to: {
    type: [String, Object] as PropType<string | RouteLocationNormalized | RouteLocationRaw>,
    default: null
  },
  target: {
    type: String,
    default: null
  },
  ariaLabel: {
    type: String,
    default: null
  },
  rounded: {
    type: Boolean,
    default: false
  },
  roundedClass: {
    type: String,
    default: () => uiPreset.button.rounded
  },
  baseClass: {
    type: String,
    default: () => uiPreset.button.base
  },
  iconBaseClass: {
    type: String,
    default: () => uiPreset.button.icon.base
  },
  leadingIconClass: {
    type: String,
    default: ''
  },
  trailingIconClass: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: null
  },
  square: {
    type: Boolean,
    default: false
  },
  truncate: {
    type: Boolean,
    default: false
  }
})

const slots = useSlots()

const button = ref(null)

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

const isLeading = computed(() => {
  return (props.icon && props.leading) || (props.icon && !props.trailing) || (props.loading && !props.trailing) || props.leadingIcon
})

const isTrailing = computed(() => {
  return (props.icon && props.trailing) || (props.loading && props.trailing) || props.trailingIcon
})

const isSquare = computed(() => props.square || (!slots.default && !props.label))

const buttonClass = computed(() => {
  return classNames(
    props.baseClass,
    uiPreset.button.size[props.size],
    uiPreset.button[isSquare.value ? 'square' : 'spacing'][props.size],
    uiPreset.button.variant[props.variant],
    props.block ? 'w-full flex justify-center items-center' : 'inline-flex items-center',
    props.rounded ? 'rounded-full' : props.roundedClass,
    props.customClass
  )
})

const leadingIconName = computed(() => {
  if (props.loading) {
    return props.loadingIcon
  }

  return props.leadingIcon || props.icon
})

const trailingIconName = computed(() => {
  if (props.loading && !isLeading.value) {
    return props.loadingIcon
  }

  return props.trailingIcon || props.icon
})

const leadingIconClass = computed(() => {
  return classNames(
    props.iconBaseClass,
    uiPreset.button.icon.size[props.size],
    (!!slots.default || !!props.label?.length) && uiPreset.button.icon.leading.spacing[props.size],
    props.leadingIconClass,
    props.loading && 'animate-spin'
  )
})

const trailingIconClass = computed(() => {
  return classNames(
    props.iconBaseClass,
    uiPreset.button.icon.size[props.size],
    (!!slots.default || !!props.label?.length) && uiPreset.button.icon.trailing.spacing[props.size],
    props.trailingIconClass,
    props.loading && !isLeading.value && 'animate-spin'
  )
})
</script>
