<template>
  <main class="flex flex-col flex-1 overflow-hidden">
    <!-- Primary column -->
    <div v-if="$slots.header" class="flex items-center flex-shrink-0 h-16 px-4 border-b sm:px-6 u-bg-white u-border-gray-200">
      <slot name="header" />
    </div>

    <Splitpanes class="flex flex-1 u-bg-gray-50 overflow-hidden">
      <!-- Secondary column (hidden on smaller screens) -->
      <Pane v-if="$slots.aside" max-size="15" class="hidden lg:block lg:flex-shrink-0">
        <div class="relative flex flex-col h-full overflow-y-auto border-r w-72 u-border-gray-200 u-bg-white">
          <div v-if="title" class="sticky top-0 flex items-center justify-between flex-shrink-0 h-16 px-6 u-bg-white z-[5]">
            <p class="text-lg font-semibold u-text-gray-900">
              {{ title }}
            </p>

            <slot name="aside-header" />
          </div>

          <slot name="aside" />
        </div>
      </Pane>

      <Pane>
        <slot />
      </Pane>
    </Splitpanes>
  </main>
</template>

<script setup lang="ts">
import Splitpanes from '../../node_modules/splitpanes/src/components/splitpanes/Splitpanes.vue'
import Pane from '../../node_modules/splitpanes/src/components/splitpanes/Pane.vue'

defineComponent({
  Splitpanes,
  Pane
})

defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>
