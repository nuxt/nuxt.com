<template>
  <div class="flex flex-col space-y-2">
    <UCard padded class="flex items-center justify-center h-28" :background-class="cardClass">
      <img :src="`/assets/resources/design-kit/logo/${imgName}.svg`" :alt="imgName" :class="full ? 'h-8' : 'h-10'">
    </UCard>
    <div class="flex justify-between">
      <p class="font-semibold">
        <Markdown :use="$slots.name" unwrap="p" />
      </p>
      <div>
        <a
          class="pr-2 hover:u-text-gray-500 u-text-gray-400 hover:underline"
          :href="`/assets/resources/design-kit/logo/${imgName}.svg`"
          aria-label="Download svg"
          download
        >svg</a>
        <a
          class="hover:u-text-gray-500 u-text-gray-400 hover:underline"
          :href="`/assets/resources/design-kit/logo/${imgName}.png`"
          aria-label="Download png"
          download
        >png</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  imgName: {
    type: String,
    default: ''
  },
  cardClass: {
    type: String,
    default: ''
  },
  full: {
    type: Boolean,
    default: false
  }
})
</script>
