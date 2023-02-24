<template>
  <Switch
    v-model="active"
    class="app-toggle"
  >
    <span
      :style="`transform: translateX(${active ? '1.25rem' : '0px'})`"
    >
      <span
        v-if="iconOn"
        :style="`${active ? 'opacity: 1; transition-timing-function: ease-in; transition-duration: 0.2s' : 'opacity: 0; transition-timing-function: ease-out; transition-duration: 0.1s'}`"
        aria-hidden="true"
      >
        <Icon :name="iconOn" class="icon-on"/>
      </span>
      <span
        v-if="iconOff"
        :style="`${active ? 'opacity: 0; transition-timing-function: ease-out; transition-duration: 0.1s' : 'opacity: 1; transition-timing-function: ease-in; transition-duration: 0.2s'}`"
        aria-hidden="true"
      >
        <Icon :name="iconOff" class="icon-off" />
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

<style lang="ts">
css({
  '.app-toggle': {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 1,
    height: '{size.24}',
    width: '44px',
    borderWidth: '{size.2}',
    borderColor: 'transparent',
    borderRadius: '{radii.full}',
    backgroundColor: '{color.gray.200}',

    '@dark': {
      backgroundColor: '{color.gray.800}'
    },

    '&:not(:active)': {
      backgroundColor: '{color.gray.100}',

      '@dark': {
        backgroundColor: '{color.gray.800}'
      },
    },

    '&:focus': {
      ringOffset: '{size.2}',

      ringColor: '{color.gray.900}',
      ringOffsetColor: '{color.white}',

      '@dark': {
        ringOffsetColor: '{color.black}'
      }
    },

    '> span': {
      pointerEvents: 'none',
      position: 'relative',
      display: 'inline-block',
      height: '{size.20}',
      width: '{size.20}',
      borderRadius: '{radii.full}',
      backgroundColor: '{color.white}',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      transition: 'all 0.2s',

      '@dark': {
        backgroundColor: '{color.black}',
      },

      '> span': {
        position: 'absolute',
        inset: 0,
        height: '{size.full}',
        width: '{size.full}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity',

        '.icon': {
          height: '{size.12}',
          width: '{size.12}',
        },

        '.icon-on': {
          color: '{color.gray.600}',

          '@dark': {
            color: '{color.gray.400}'
          }
        },

        '.icon-off': {
          color: '{color.gray.400}',

          '@dark': {
            color: '{color.gray.600}'
          }
        }
      }
    }
  }
})
</style>
