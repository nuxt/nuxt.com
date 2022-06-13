<template>
  <UContainer :constrained="false" class="relative flex flex-col items-center justify-center py-24">
    <div :class="sectionTitleColorClass" class="pb-2 font-semibold">
      <Markdown :use="$slots.sectionTitle" unwrap="p" />
    </div>
    <h2 class="max-w-[52rem] pb-24 text-6xl font-semibold text-center ">
      <Markdown :use="$slots.title" unwrap="p" />
    </h2>
    <p v-if="$slots.description" class="text-2xl text-center u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <div
      class="items-center justify-center"
      :class="[
        { 'grid grid-cols-1 lg:grid-cols-2 gap-x-[180px] items-center justify-center gap-y-8': ['left', 'right'].includes(bodyPlacement) },
      ]"
    >
      <div v-if="withBodyText" padded class="flex flex-col max-w-xl px-4 text-left gap-y-6 sm:px-0" :class="[{ 'order-last': bodyPlacement === 'left' }]">
        <div v-if="$slots.bodyTitle" class="text-4xl font-semibold u-text-gray-900">
          <Markdown :use="$slots.bodyTitle" unwrap="p" />
        </div>
        <div v-if="$slots.bodyDescription" class="items-center text-2xl u-text-gray-600">
          <Markdown :use="$slots.bodyDescription" unwrap="p" />
        </div>
        <NuxtLink v-if="$slots.bodyLink" :to="to" class="flex items-center w-full font-semibold gap-x-4">
          <span class="text-2xl u-text-gray-900">
            <Markdown :use="$slots.bodyLink" unwrap="p" />
          </span>
          <UIcon name="heroicons-solid:arrow-right" class="w-5 h-5 u-text-gray-900" />
        </NuxtLink>
        <UButton v-if="$slots.bodyButton" :to="to" variant="secondary" size="lg" class="flex justify-center w-[224px]">
          <Markdown :use="$slots.bodyButton" unwrap="p" />
        </UButton>
      </div>

      <img v-if="image" :src="`/assets/home/${image}`" :alt="`${image} illustration`" :class="imageClass" class="px-4 sm:px-0">

      <!-- Markdown :use="$slots.default" unwrap="p" /-->
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  sectionTitleColorClass: {
    type: String,
    default: 'text-green-400'
  },
  bodyPlacement: {
    type: String,
    default: 'center',
    validator: (value: string) => {
      return ['left', 'center', 'right'].includes(value)
    }
  },
  image: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: ''
  },
  withBodyText: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: ''
  }
})
</script>
