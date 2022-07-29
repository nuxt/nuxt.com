<template>
  <div class="relative">
    <UContainer
      class="py-[100px] flex flex-col items-center justify-between w-full lg:flex-row gap-y-8 px-4"
    >
      <!-- text -->
      <div
        padded
        class="flex flex-col items-center max-w-lg px-4 text-center lg:items-start lg:max-w-md gap-y-6 sm:px-0 xl:max-w-lg 2xl:max-w-xl lg:text-left"
        :class="[
          { 'lg:order-last': textPlacement === 'right' },
        ]"
      >
        <div class="text-2xl font-semibold sm:text-3xl u-text-gray-500">
          <Markdown :use="$slots.title" unwrap="p" />
        </div>
        <div class="text-gray-500 sm:text-lg u-text-gray-700">
          <Markdown :use="$slots.description" unwrap="p" />
        </div>
        <NuxtLink :to="to" class="relative flex-nowrap max-w-max group">
          <div class="flex items-center justify-center font-semibold lg:justify-start gap-x-4 ">
            <span class="sm:text-xl u-text-gray-900">
              <Markdown :use="$slots.link" unwrap="p" />
            </span>

            <UIcon name="uil:arrow-right" class="w-6 h-6 u-text-gray-900" />
          </div>
          <div class="absolute -bottom-2 w-0 h-0.5 u-bg-black group-hover:w-full transition-all duration-300 ease-in-out" />
        </NuxtLink>
      </div>
      <Markdown :use="$slots.card" unwrap="p" />
    </UContainer>
    <img v-if="image" :src="`/assets/company/partners/${image}.svg`" :alt="`gem image`" :class="imageClass" class="absolute">
  </div>
</template>

<script setup lang="ts">
defineProps({
  textPlacement: {
    type: String,
    default: 'left',
    validator: (value: string) => {
      return ['left', 'right'].includes(value)
    }
  },
  to: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  }
})
</script>
