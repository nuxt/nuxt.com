<template>
  <div class="relative flex-1">
    <slot name="header" />

    <main class="relative pb-4 sm:pb-6 lg:py-8">
      <UContainer padded>
        <div class="grid grid-cols-10 gap-8 relative">
          <aside
            v-if="$slots.aside"
            class="pb-8 overflow-x-hidden overflow-y-auto lg:pb-0 hidden lg:block lg:sticky lg:pt-8 lg:-mt-8 lg:self-start col-span-2"
            :class="{
              'lg:max-h-[calc(100vh-64px)] lg:top-16': offset,
              'lg:top-0 lg:max-h-screen': !offset
            }"
          >
            <slot name="aside" />
          </aside>

          <div class="relative" :class="{ 'col-span-10 lg:col-span-8': !!$slots.aside, 'col-span-10': !$slots.aside }">
            <slot />
          </div>
        </div>
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps({
  offset: {
    type: Boolean,
    default: true
  }
})
</script>
