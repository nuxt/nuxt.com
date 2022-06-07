<template>
  <li>
    <a :href="href" class="flex flex-col w-[120px] h-[120px] sm:w-[148px] sm:h-[146px] items-center justify-center py-6 transition duration-300 rounded-md gap-y-2 hover:bg-gray-800 px-1">
      <img :src="`/assets/community/about/${icon}`" :alt="icon">
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
  }
})
</script>
