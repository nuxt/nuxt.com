<template>
  <div class="u-bg-white flex-1">
    <div v-if="$slots.header" class="border-y u-border-gray-200 u-bg-white z-[1] sticky top-0">
      <UContainer padded>
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 items-center justify-between h-12">
          <slot name="header" />
        </div>
      </UContainer>
    </div>

    <main class="relative py-8">
      <UContainer>
        <div class="lg:grid lg:grid-cols-12 lg:gap-10 lg:relative">
          <aside class="pb-8 lg:pb-0 lg:sticky lg:top-12 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-3">
            <slot name="left" />
          </aside>

          <div class="space-y-6 sm:px-6 lg:px-0 lg:col-span-7">
            <slot />
          </div>

          <div class="pb-8 lg:pb-0 lg:sticky lg:top-12 sm:px-6 lg:px-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-2">
            <slot name="right" />
          </div>
        </div>
      </UContainer>
    </main>
  </div>
</template>
