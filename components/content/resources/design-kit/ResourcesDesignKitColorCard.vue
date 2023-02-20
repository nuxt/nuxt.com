<template>
  <li>
    <AppCard
      :shadow="false"
      :background-class="backgroundColor"
    />

    <div class="flex items-center justify-between pt-2">
      <h5 class="font-semibold u-text-gray-900">
        <ContentSlot :use="$slots.color" unwrap="p" />
      </h5>
      <AppButton variant="transparent" label="Copy" size="sm" class="copy-button" @click="onClick" />
    </div>
    <p class="u-text-gray-500">
      {{ hexaColor }}
    </p>
  </li>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  backgroundColor: {
    type: String as PropType<'green' | 'white' | 'black'>,
    default: ''
  },
  hexaColor: {
    type: String,
    default: ''
  }
})

const { $clipboard } = useNuxtApp()

const onClick = () => {
  $clipboard.copy(props.hexaColor, { title: 'Color copied to clipboard!' })
}
</script>

<style lang="ts" scoped>
css({
  '.app-card': {
      height: '140px !important',
      backgroundColor: (props) => props.backgroundColor === 'black' ? '{color.gray.900} !important' : props.backgroundColor === 'green' ? '{color.green.400} !important' : '{color.white} !important',

      '@dark': {
        backgroundColor: (props) => props.backgroundColor === 'black' ? '{color.gray.900} !important' : props.backgroundColor === 'green' ? '{color.green.400} !important' : '{color.white} !important'
      }
    },

  '.copy-button': {
    padding: '0px !important',
    color: '{color.gray.400} !important',
    ringOffset: '{color.transparent} !important',
    ringColor: '{color.transparent} !important',

    '@dark': {
      color: '{color.gray.400} !important',
    },

    '&:hover': {
      color: '{color.gray.600} !important',
      '@dark': {
        color: '{color.gray.400} !important'
      }
    }
  }
})
</style>
