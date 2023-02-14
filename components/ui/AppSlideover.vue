<script setup lang="ts">
const { visible, close } = useSlideover()
</script>

<template>
  <ClientOnly>
    <teleport to="body">
      <div class="overflow-y-auto fixed top-0 left-0 h-screen z-[100] focus:outline-none flex flex-col flex-1 w-full max-w-md u-bg-white border-r border-r-gray-300 dark:border-r-gray-700 transition duration-300" :class="visible ? 'translate-x-0' : '-translate-x-full'">
        <div class="z-[100] flex items-center justify-between flex-shrink-0 px-4 sm:px-6 h-16 border-b u-border-gray-200">
          <slot name="header" />
        </div>
        <div class="px-1">
          <slot />
        </div>
      </div>

      <div
        class="fixed top-0 left-0 z-50 w-screen h-screen transition-all duration-100"
        :class="visible ? 'backdrop-blur-sm' : 'backdrop-blur-none pointer-events-none opacity-0'"
        @click.prevent="close"
      />
    </teleport>
  </ClientOnly>
</template>
