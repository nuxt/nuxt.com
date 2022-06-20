<template>
  <li
    class="flex w-full xl:justify-center"
    :class="itemClass"
  >
    <a
      :hr`e`f="href"
      class="flex flex-col w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] items-center justify-center py-6 transition duration-300 rounded-md gap-y-2 hover:bg-gray-800 px-1"
    >
      <UIcon :name="`fa6-brands:${icon}`" class="flex-shrink-0 w-10 h-10 text-white" :alt="`${icon} icon`" />
      <div class="font-semibold text-center text-white sm:text-xl">
        <Markdown :use="$slots.title" unwrap="p" />
      </div>
    </a>
  </li>
</template>

<script setup lang="ts">
defineProps({
  href: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  itemClass: {
    type: String,
    default: ''
  }
})
</script>
