<template>
  <div class="relative flex-1">
    <slot name="header" />

    <main class="relative pb-12 sm:pb-16 lg:pb-20 lg:pt-8">
      <UContainer padded>
        <div class="relative grid grid-cols-10 gap-8">
          <aside
            v-if="!!$slots.aside"
            class="hidden col-span-2 pb-8 overflow-x-hidden overflow-y-auto lg:pb-0 lg:block lg:self-start"
            :class="{
              'lg:max-h-[calc(100vh-64px)] lg:top-16 lg:sticky lg:pt-8 lg:-mt-8': sticky
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
  sticky: {
    type: Boolean,
    default: true
  }
})
</script>
