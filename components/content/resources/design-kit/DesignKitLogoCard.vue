<template>
  <div class="flex flex-col space-y-2">
    <UCard class="h-28 flex items-center justify-center" :background-class="cardClass">
      <img :src="`/resources/design-kit/logo/${imgName}.svg`" :alt="imgName" :class="full ? 'h-8' : 'h-10'">
    </UCard>
    <div class="flex justify-between">
      <p class="font-bold">
        <Markdown use="name" unwrap="p" />
      </p>
      <div>
        <a
          class="hover:u-text-gray-500 u-text-gray-400 hover:underline pr-2"
          :href="`/resources/design-kit/logo/${imgName}.svg`"
          aria-label="Download svg"
          download
        >svg</a>
        <a
          class="hover:u-text-gray-500 u-text-gray-400 hover:underline"
          :href="`/resources/design-kit/logo/${imgName}.png`"
          aria-label="Download svg"
          download
        >png</a>
      </div>
    </div>
  </div>
</template>

<script setup>
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
