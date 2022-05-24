<template>
  <div class="relative py-12 overflow-hidden">
    <div v-if="$slots.background" class="absolute inset-y-0 right-0">
      <slot name="background" />
    </div>

    <UContainer padded class="relative">
      <div v-if="$slots.image" class="absolute inset-y-0 right-4 sm:right-6 lg:right-8">
        <slot name="image" />
      </div>

      <div
        v-bind="$attrs"
        class="relative flex flex-col items-center justify-center gap-y-5"
        :class="{
          'sm:items-start': !centered,
          'h-72': !!$slots.image || !!$slots.background,
          'sm:py-8': !$slots.image
        }"
      >
        <h1 class="text-4xl font-semibold text-center sm:text-5xl u-text-gray-900" :class="{ 'sm:text-left': !centered }">
          <slot name="title" />
        </h1>
        <p class="font-medium text-center sm:text-lg u-text-gray-500" :class="[descriptionWidthClass, { 'sm:text-left': !centered }]">
          <slot name="description" />
        </p>

        <slot name="extra" />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
defineProps({
  centered: {
    type: Boolean,
    default: false
  },
  descriptionWidthClass: {
    type: String,
    default: 'sm:max-w-lg'
  }
})
</script>
