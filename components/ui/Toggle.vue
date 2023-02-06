<template>
  <Switch
    v-model="active"
    :class="[active ? activeClass : inactiveClass, baseClass]"
  >
    <span
      :class="[
        active ? containerActiveClass : containerInactiveClass,
        containerBaseClass,
      ]"
    >
      <span
        v-if="iconOn"
        :class="[active ? iconActiveClass : iconInactiveClass, iconBaseClass]"
        aria-hidden="true"
      >
        <Icon :name="iconOn" :class="iconOnClass" />
      </span>
      <span
        v-if="iconOff"
        :class="[active ? iconInactiveClass : iconActiveClass, iconBaseClass]"
        aria-hidden="true"
      >
        <Icon :name="iconOff" :class="iconOffClass" />
      </span>
      <slot />
    </span>
  </Switch>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Switch } from '@headlessui/vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  iconOn: {
    type: String,
    default: null
  },
  iconOff: {
    type: String,
    default: null
  },
  baseClass: {
    type: String,
    default: () => 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900 focus:ring-offset-white dark:focus:ring-offset-black'
  },
  activeClass: {
    type: String,
    default: () => 'bg-gray-100 dark:bg-gray-800'
  },
  inactiveClass: {
    type: String,
    default: () => 'bg-gray-100 dark:bg-gray-800'
  },
  containerBaseClass: {
    type: String,
    default: () => 'pointer-events-none relative inline-block h-5 w-5 rounded-full u-bg-white shadow transform ring-0 transition ease-in-out duration-200'
  },
  containerActiveClass: {
    type: String,
    default: () => 'translate-x-5'
  },
  containerInactiveClass: {
    type: String,
    default: () => 'translate-x-0'
  },
  iconBaseClass: {
    type: String,
    default: () => 'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity'
  },
  iconActiveClass: {
    type: String,
    default: () => 'opacity-100 ease-in duration-200'
  },
  iconInactiveClass: {
    type: String,
    default: () => 'opacity-0 ease-out duration-100'
  },
  iconOnClass: {
    type: String,
    default: () => 'h-3 w-3 u-text-gray-600'
  },
  iconOffClass: {
    type: String,
    default: () => 'h-3 w-3 u-text-gray-400'
  }
})

const emit = defineEmits(['update:modelValue'])

const active = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})
</script>
