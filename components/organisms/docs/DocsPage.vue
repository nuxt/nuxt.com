<template>
  <div class="relative flex-1">
    <slot name="header" />

    <main class="relative py-8">
      <UContainer>
        <div v-if="$slots.left && $slots.right" class="lg:grid lg:grid-cols-10 lg:gap-10 lg:relative">
          <aside class="pb-8 overflow-x-hidden overflow-y-auto lg:pb-0 hidden lg:block lg:sticky lg:top-16 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-2 lg:h-[calc(100vh-64px)]">
            <slot name="left" />
          </aside>

          <div class="space-y-6 overflow-hidden px-4 sm:px-0 lg:col-span-6">
            <slot />
          </div>

          <div class="pb-8 lg:pb-0 lg:sticky hidden lg:block lg:top-16 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-2">
            <slot name="right" />
          </div>
        </div>
        <slot v-else />
      </UContainer>
    </main>
  </div>
</template>
