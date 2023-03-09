<template>
  <div class="flex flex-col space-y-2">
    <AppCard :shadow="false">
      <div
        class="absolute right-2 top-2 rounded-md text-xs bg-transparent border info p-1"
        :class="[
          { 'border-green-400 text-gray-900': infoType === 'primary' },
          { 'border-green-400 text-white': infoType === 'primary-dark' },
          { 'border-gray-900 text-gray-900': infoType === 'secondary' },
          { 'border-gray-300 text-gray-300': infoType === 'secondary-dark' }
        ]"
      >
        <ContentSlot :use="$slots.info" unwrap="p" />
      </div>
      <img :src="`/assets/design-kit/logo/${imgName}.svg`" :alt="imgName" :class="full ? 'h-8' : 'h-10'">
    </AppCard>
    <div class="flex justify-between">
      <p class="font-semibold">
        <ContentSlot :use="$slots.name" unwrap="p" />
      </p>
      <div>
        <a
          class="pr-2 hover:u-text-gray-500 u-text-gray-400 hover:underline"
          :href="`/assets/design-kit/logo/${imgName}.svg`"
          aria-label="Download svg"
          download
        >svg</a>
        <a
          class="hover:u-text-gray-500 u-text-gray-400 hover:underline"
          :href="`/assets/design-kit/logo/${imgName}.png`"
          aria-label="Download png"
          download
        >png</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  imgName: {
    type: String,
    default: ''
  },
  full: {
    type: Boolean,
    default: false
  },
  backgroundColor: {
    type: String as PropType<'black' | 'white' | 'green'>,
    default: 'white'
  },
  infoType: {
    type: String as PropType<'primary' | 'primary-dark' | 'secondary' | 'secondary-dark'>,
    default: 'primary'
  }
})
</script>

<style lang="ts" scoped>
css({
  '.app-card': {
      display: 'flex !important',
      height: '140px !important',
      alignItems: 'center !important',
      justifyContent:'center !important',
      position: 'relative !important',
      backgroundColor: (props) => props.backgroundColor === 'black' ? '{color.gray.900} !important' : props.backgroundColor === 'green' ? '{color.green.400} !important' : '{color.white} !important',

      '@dark': {
        backgroundColor: (props) => props.backgroundColor === 'black' ? '{color.gray.900} !important' : props.backgroundColor === 'green' ? '{color.green.400} !important' : '{color.white} !important'
      }
    }
})
</style>
