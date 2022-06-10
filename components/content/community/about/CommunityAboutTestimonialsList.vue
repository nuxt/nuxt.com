<template>
  <div class="flex flex-col">
    <div class="relative">
      <ul class="z-[-1] grid grid-cols-1 overflow-hidden list-none gap-y-8 gap-x-36 sm:grid-cols-2 lg:grid-cols-3" :class="show ? 'h-full' : 'h-[320px]'">
        <Markdown :use="$slots.items" unwrap="p" />
      </ul>

      <div
        class="absolute inset-x-0 bottom-0 flex justify-center pt-16 pb-8 pointer-events-none bg-gradient-to-t from-white dark:from-black"
        :class="show ? 'opacity-0' : 'opacity-100'"
      />
    </div>
    <div class="flex justify-center">
      <UButton variant="secondary" size="lg" class="flex justify-center w-40 mt-12" @click="show = !show">
        <span class="px-4 py-1 text-center">
          {{ show ? hideText : showText }}
        </span>
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  showText: {
    type: String,
    default: 'See more'
  },
  hideText: {
    type: String,
    default: 'Hide'
  }
})

const show = ref(false)
</script>
