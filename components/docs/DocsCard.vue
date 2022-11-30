<template>
  <li class="relative flex flex-col justify-between border border-gray-200 dark:border-gray-800 p-4" :class="roundedClass">
    <div>
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
    <div v-if="image" class="flex flex-col h-full w-full gap-x-4 items-end justify-center">
      <img
        :src="`${image.path}-light.png`"
        :width="image.width"
        :height="image.height"
        alt=""
        class="dark:hidden absolute right-0 bottom-0 object-cover h-[52px] w-[42px] md:h-[92px] md:w-[72px] opacity-0 md:opacity-100"
        role="presentation"
      >
      <img
        :src="`${image.path}-dark.png`"
        :width="image.width"
        :height="image.height"
        alt=""
        class="hidden dark:block absolute right-0 bottom-0 object-cover h-[52px] w-[42px] md:h-[92px] md:w-[72px] opacity-0 md:opacity-100"
        role="presentation"
      >
    </div>
  </li>
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
    default: 'rounded-lg'
  }
})
</script>
