<template>
  <span :class="wrapperClass">
    <img v-if="url && !error" :class="avatarClass" :src="url" :alt="alt" :onerror="() => onError()">
    <span v-else-if="text || placeholder" :class="placeholderClass">{{ text || placeholder }}</span>

    <span v-if="chip" :class="chipClass" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { classNames } from '../../utils'
import { uiPreset } from '../../ui/preset'

const props = defineProps({
  src: {
    type: [String, Boolean],
    default: null
  },
  alt: {
    type: String,
    default: null
  },
  text: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator (value: string) {
      return Object.keys(uiPreset.avatar.size).includes(value)
    }
  },
  rounded: {
    type: Boolean,
    default: true
  },
  chip: {
    type: Boolean,
    default: false
  },
  wrapperClass: {
    type: String,
    default: () => uiPreset.avatar.wrapper
  },
  backgroundClass: {
    type: String,
    default: () => uiPreset.avatar.background
  },
  placeholderClass: {
    type: String,
    default: () => uiPreset.avatar.placeholder
  },
  roundedClass: {
    type: String,
    default: () => uiPreset.avatar.rounded
  }
})

const wrapperClass = computed(() => {
  return classNames(
    props.wrapperClass,
    props.backgroundClass,
    uiPreset.avatar.size[props.size],
    props.rounded ? 'rounded-full' : props.roundedClass
  )
})

const avatarClass = computed(() => {
  return classNames(
    uiPreset.avatar.size[props.size],
    props.rounded ? 'rounded-full' : props.roundedClass
  )
})

const chipClass = computed(() => {
  return classNames(
    uiPreset.avatar.chip.base,
    uiPreset.avatar.chip.position[props.chipPosition],
    uiPreset.avatar.chip.variant[props.chipVariant],
    uiPreset.avatar.chip.size[props.size]
  )
})

const url = computed(() => {
  if (typeof props.src === 'boolean') {
    return null
  }
  return props.src
})

const placeholder = computed(() => {
  return (props.alt || '').split(' ').map(word => word.charAt(0)).join('').substring(0, 2)
})

const error = ref(false)

watch(() => props.src, () => {
  if (error.value) {
    error.value = false
  }
})

function onError () {
  error.value = true
}
</script>
