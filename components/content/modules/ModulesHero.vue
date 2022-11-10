<template>
  <PageHero>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
    <template #image>
      <div class="h-full flex items-center justify-center">
        <img src="/assets/modules/hero-light.webp" class="dark:hidden object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/modules/hero-dark.webp" class="hidden dark:block object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>
