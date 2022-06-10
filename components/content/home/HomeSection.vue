<template>
  <UContainer class="grid items-center justify-center grid-cols-1 py-24 sm:grid-cols-2">
    <div :class="sectionTitleColorClass" class="pb-2">
      <Markdown :use="$slots.sectionTitle" unwrap="p" />
    </div>
    <h2 class="pb-24 text-6xl font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h2>
    <p v-if="$slots.description" class="text-2xl u-text-gray-600">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
    <div
      class="items-center justify-center"
      :class="[
        { 'grid grid-cols-1 sm:grid-cols-2 gap-x-[180px]': ['left', 'right'].includes(bodyPlacement) },
      ]"
    >
      <div v-if="withBodyText" class="flex flex-col text-center sm:text-left gap-y-6" :class="{ 'order-last': bodyPlacement === 'right' }">
        <div v-if="$slots.bodyTitle" class="font-semibold u-text-gray-900">
          <Markdown :use="$slots.bodyTitle" unwrap="p" />
        </div>
        <div v-if="$slots.bodyDescription" class="text-2xl u-text-gray-600">
          <Markdown :use="$slots.bodyDescription" unwrap="p" />
        </div>
        <NuxtLink v-if="$slots.bodyLink" :to="to" class="flex gap-x-4">
          <span class="w-4 h-4 text-2xl u-text-gray-900">
            <Markdown :use="$slots.bodyLink" unwrap="p" />
          </span>
          <UIcon name="heroicons-solid:arrow-right" class="w-4 h-4 text-2xl u-text-gray-900" />
        </NuxtLink>
      </div>
      <img v-if="withImage" :src="image" :alt="`${image} illustration`" :class="imageClass">
      <Markdown :use="$slots.default" unwrap="p" />
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
  withImage: {
    type: Boolean,
    default: true
  },
  to: {
    type: String,
    default: ''
  }
})
</script>
