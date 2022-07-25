<template>
  <div class="relative py-6 overflow-hidden sm:py-12">
    <div v-if="$slots.background" class="absolute inset-y-0 right-0">
      <slot name="background" />
    </div>

    <UContainer padded class="relative">
      <div v-if="$slots.image" class="absolute -right-12 -inset-y-6 sm:inset-y-0 sm:right-6 lg:right-8">
        <slot name="image" />
      </div>

      <div
        v-bind="$attrs"
        class="relative flex flex-col justify-center gap-y-4 sm:gap-y-5"
        :class="{
          'items-center': centered,
          'sm:h-72': !!$slots.image || !!$slots.background,
          'sm:py-8': !$slots.image
        }"
      >
        <h1 class="text-4xl font-semibold sm:text-5xl u-text-gray-900" :class="{ 'text-center': centered }">
          <slot name="title" />
        </h1>
        <p class="font-medium sm:text-lg u-text-gray-500" :class="[descriptionWidthClass, { 'text-center': centered }]">
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
