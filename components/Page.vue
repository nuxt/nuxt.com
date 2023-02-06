<template>
  <div class="relative flex-1">
    <slot name="header" />
    <NuxtErrorBoundary>
      <section class="relative pb-16 sm:pb-32 lg:pt-8" :class="{ 'overflow-hidden': !sticky }">
        <UContainer padded>
          <div class="relative grid grid-cols-10 gap-8">
            <aside
              v-if="!!$slots.aside"
              class="hidden col-span-2 pb-8 overflow-x-hidden overflow-y-auto lg:block lg:self-start sm:-mb-24"
              :class="{
                'lg:max-h-[calc(100vh-64px)] lg:top-16 lg:sticky lg:pt-8 lg:-mt-8': sticky
              }"
            >
              <slot name="aside" />
            </aside>

            <div class="relative" :class="{ 'col-span-10 lg:col-span-8': !!$slots.aside, 'col-span-10': !$slots.aside, 'order-first': reverse }">
              <slot />
            </div>
          </div>
        </UContainer>
      </section>
      <template #error="{ error }">
        <UContainer padded class="text-center">
          <h3 class="text-lg font-semibold mb-6">
            An error occurred
          </h3>
          <Alert type="info" class="mb-6">
            {{ error }}
          </Alert>
          <AppButton to="/" label="Go back home" variant="primary-gradient" class="mb-6" />
        </UContainer>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>

<script setup lang="ts">
defineProps({
  sticky: {
    type: Boolean,
    default: true
  },
  reverse: {
    type: Boolean,
    default: false
  }
})
</script>
