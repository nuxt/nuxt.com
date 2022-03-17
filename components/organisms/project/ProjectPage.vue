<template>
  <main class="flex flex-1 overflow-hidden">
    <!-- Primary column -->
    <section class="flex flex-col flex-1 h-full min-w-0 lg:order-last u-bg-gray-50">
      <div v-if="$slots.header" class="flex items-center justify-between flex-shrink-0 h-16 px-4 border-b sm:px-6 lg:px-8 u-bg-white u-border-gray-200">
        <slot name="header" />
      </div>

      <div class="flex flex-col flex-1 p-4 overflow-y-auto sm:p-6 lg:p-8">
        <slot />
      </div>
    </section>

    <!-- Secondary column (hidden on smaller screens) -->
    <aside v-if="$slots.aside" class="hidden lg:block lg:flex-shrink-0 lg:order-first">
      <div class="relative flex flex-col h-full overflow-y-auto border-r w-72 u-border-gray-200 u-bg-white">
        <div class="sticky top-0 flex items-center justify-between flex-shrink-0 h-16 px-6 u-bg-white">
          <p class="text-lg font-semibold text-blue-gray-900">
            {{ title }}
          </p>

          <slot name="aside-header" />
        </div>

        <slot name="aside" />
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>
