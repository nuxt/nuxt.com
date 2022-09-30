<template>
  <div class="flex flex-col md:flex-row items-start md:items-center gap-x-4 sm:gap-x-8 max-w-[520px] pr-2 pl-8 md:pl-0 ">
    <div
      v-if="$slots.year"
      class="inline-block lg:hidden py-1 md:py-[7px] px-4 md:px-6 text-xl md:backdrop-blur-lg rounded-[7px] font-semibold transition-all duration-300 text-gray-900 md:u-text-gray-900 mb-2"
      :class="`${colorClass} md:bg-transparent`"
    >
      <ContentSlot :use="$slots.year" unwrap="p" />
    </div>
    <div>
      <h6 class="pb-2 text-lg font-semibold u-text-gray-900">
        <ContentSlot :use="$slots.title" unwrap="p" />
      </h6>
      <p class="text-sm u-text-gray-700">
        <ContentSlot :use="$slots.description" unwrap="p" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  colorClass: {
    type: String,
    default: ''
  }
})
</script>
