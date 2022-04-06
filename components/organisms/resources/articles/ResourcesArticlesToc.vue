<template>
  <div
    class="sticky top-0 pt-8 lg:pt-0 lg:top-20 w-full z-[1] h-full max-h-[calc(100vh-400px)]"
    :class="mq.lgMinus ? 'inset-x-0' : 'right-0'"
  >
    <!-- fake filter to increase readability-->
    <div class="lg:hidden absolute inset-y-0 backdrop-blur-md -inset-x-8" />
    <div
      class="absolute py-3 lg:py-0 top-0 lg:w-40 lg:max-h-screen backdrop-blur-md bg-white/75 dark:bg-black/75 lg:u-bg-white border-b border-dashed lg:border-none "
      :class="mq.lgMinus ? 'inset-x-0' : 'right-0'"
    >
      <UButton
        variant="transparent"
        label="Table of contents"
        base-class="px-0 z-[1]"
        trailing
        class="lg:hidden font-semibold"
        :icon="show ? 'heroicons-solid:chevron-down' : 'heroicons-solid:chevron-right'"
        @click="show = !show"
      />
      <ul v-if="show || !mq.lgMinus" class="flex flex-col gap-y-2 pt-2">
        <span class="hidden lg:block font-semibold">Table of Contents</span>
        <li v-for="link in toc" :key="link.id" class="font-medium text-gray-600 lg:text-gray-400 text-sm lg:text-base">
          {{ link.text }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { useMq } from 'vue3-mq'

defineProps({
  toc: {
    type: Array,
    default: () => []
  }
})

const mq = useMq()

const show = ref(false)
</script>
