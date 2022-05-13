<template>
  <UContainer padded class="pb-12">
    <div class="flex flex-col grid-cols-1 gap-8 md:grid sm:grid-cols-2 lg:grid-cols-3 md:h-[475px]">
      <div class="relative md:absolute right-0 flex items-center justify-center lg:col-span-1 h-[475px] md:h-auto">
        <img src="/company/support/gems.svg">
        <div class="h-[170px] absolute top-0 inset-x-0 bg-gradient-to-b from-white dark:from-black to-transparent" />
        <div class="w-[170px] absolute right-0 inset-y-0 bg-gradient-to-l from-white dark:from-black to-transparent" />
      </div>

      <div class="relative flex flex-col justify-center py-8 space-y-5 lg:col-span-2">
        <h1 class="text-5xl font-semibold lg:max-w-xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="text-lg font-medium lg:max-w-xl u-text-gray-500">
          <Markdown use="description" unwrap="p" />
        </p>

        <div class="flex gap-6">
          <UButton
            v-for="(button, index) in buttons"
            :key="index"
            v-bind="button"
          />
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
defineProps({
  buttons: {
    type: Array,
    default: () => []
  }
})
</script>
