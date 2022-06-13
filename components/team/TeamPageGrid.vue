<template>
  <div class="lg:grid lg:grid-cols-12 lg:gap-10 lg:relative">
    <aside class="pb-6 lg:pb-0 lg:sticky lg:top-0 lg:pt-8 lg:-mt-8 lg:self-start lg:col-span-3">
      <slot name="aside" />
    </aside>

    <div class="space-y-6 lg:col-span-9">
      <slot />
    </div>
  </div>
</template>
