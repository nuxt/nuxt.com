<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <GradientNuxtLink icon="uil:arrow-right" to="https://www.figma.com/community/file/1063820502268406301" target="_blank" class="font-semibold u-text-gray-900 sm:text-lg">
        <ContentSlot :use="$slots.buttonText" unwrap="p" />
      </GradientNuxtLink>
    </template>

    <template #image>
      <div class="h-full flex items-center justify-center">
        <img src="/assets/resources/design-kit/hero-designkit-light.svg" alt="Design kit illustration" class="dark:hidden object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/resources/design-kit/hero-designkit-dark.svg" alt="Design kit illustration" class="hidden dark:block object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
