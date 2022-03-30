<template>
  <div class="relative flex-1">
    <slot name="header" />

    <main class="relative py-8">
      <UContainer>
        <div v-if="$slots.left && $slots.right" class="md:grid md:grid-cols-10 md:gap-10 md:relative">
          <aside class="pb-8 overflow-x-hidden overflow-y-auto md:pb-0 hidden md:block md:sticky md:top-16 sm:px-6 md:px-0 md:pt-8 md:-mt-8 md:self-start md:col-span-2 md:h-[calc(100vh-64px)]">
            <slot name="left" />
          </aside>

          <div class="space-y-6 overflow-hidden px-4 sm:px-0 md:col-span-6">
            <slot />
          </div>

          <div class="pb-8 md:pb-0 md:sticky hidden md:block md:top-16 sm:px-6 md:px-0 md:pt-8 md:-mt-8 md:self-start md:col-span-2">
            <slot name="right" />
          </div>
        </div>
        <slot v-else />
      </UContainer>
    </main>
  </div>
</template>
