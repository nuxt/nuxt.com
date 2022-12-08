<template>
  <div class="relative flex flex-col gap-2justify-between border border-gray-200 dark:border-gray-800 p-4" :class="roundedClass">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <h2 v-if="$slots.title" class="text-3xl font-semibold sm:text-5xl u-text-gray-900 mb-2 mt-2">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h2>
        <h2 v-if="$slots.extraTitle" class="font-semibold u-text-gray-900" :class="fontSizeClass">
          <ContentSlot :use="$slots.extraTitle" unwrap="p" />
        </h2>
        <p class="u-text-gray-500" :class="descriptionClass">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
      </div>

      <div v-if="buttons.length" class="flex lg:flex-row lg:justify-end gap-2 lg:gap-6 pt-8 lg:pt-0 lg:w-1/3">
        <UButton
          v-for="button of buttons"
          :key="button.label"
          :variant="button.variant || 'transparent'"
          :icon="button.icon || undefined"
          :label="button.label || ''"
          :to="button.to || null"
          :trailing="button.trailing"
          :size="'lg' || button.size"
          class="focus-visible:ring-2"
        />
      </div>
    </div>
    <div v-if="image" class="flex flex-col h-full w-full gap-x-4 items-end justify-center">
      <img
        :src="`${image.path}-light.png`"
        :width="image.width"
        :height="image.height"
        alt=""
        class="dark:hidden absolute right-0 bottom-0 object-cover opacity-0 md:opacity-100"
        role="presentation"
      >
      <img
        :src="`${image.path}-dark.png`"
        :width="image.width"
        :height="image.height"
        alt=""
        class="hidden dark:block absolute right-0 bottom-0 object-cover opacity-0 md:opacity-100"
        role="presentation"
      >
    </div>
  </div>
</template>

<script setup lang="ts">

defineProps({
  image: {
    type: Object,
    default: () => {}
  },
  fontSizeClass: {
    type: String,
    default: ''
  },
  descriptionClass: {
    type: String,
    default: ''
  },
  roundedClass: {
    type: String,
    default: 'rounded'
  },
  buttons: {
    type: Array as PropType<{ label?: string, variant?: string, to?: string, icon?: string, trailing?: boolean, size?: string }[]>,
    default: () => []
  }
})
</script>
