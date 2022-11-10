<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <a class="relative inline-flex items-center group flex-nowrap max-w-max" href="/assets/design-kit/nuxt-assets.zip" download>
        <ContentSlot :use="$slots.buttonText" unwrap="p" />
        <span
          class="gradient-border rounded absolute bg-[length:200%] left-0 font-semibold -bottom-1 h-0.5 w-4 group-hover:bg-auto group-hover:w-full duration-300 transition-ease bg-gradient-to-r from-green-400 to-teal-400"
        />
        <Icon name="uil:arrow-right" class="w-5 h-5 ml-1 mt-0.5" />
      </a>
    </template>

    <template #image>
      <div class="h-full flex items-center justify-center">
        <img src="/assets/design-kit/hero-designkit-light.webp" alt="Design kit illustration" class="dark:hidden object-cover h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
        <img src="/assets/design-kit/hero-designkit-dark.webp" alt="Design kit illustration" class="hidden dark:block object-cover h-3/4 lg:mx-10 opacity-0 lg:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
