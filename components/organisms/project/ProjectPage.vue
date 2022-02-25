<template>
  <main class="flex-1 flex overflow-hidden">
    <!-- Primary column -->
    <section class="min-w-0 flex-1 h-full overflow-y-auto lg:order-last">
      <div class="h-full p-4 sm:p-6 lg:p-8 xl:p-10">
        <slot />
      </div>
    </section>

    <!-- Secondary column (hidden on smaller screens) -->
    <aside v-if="$slots.aside" class="hidden lg:block lg:flex-shrink-0 lg:order-first">
      <div class="h-full relative flex flex-col w-72 border-r u-border-gray-200 u-bg-white overflow-y-auto">
        <div class="flex-shrink-0 h-16 px-6 flex items-center">
          <p class="text-lg font-semibold text-blue-gray-900">
            {{ title }}
          </p>
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
