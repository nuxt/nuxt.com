<template>
  <PageHero description-width-class="sm:max-w-2xl">
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <GradientNuxtLink icon="heroicons-outline:arrow-sm-right" to="https://www.figma.com/community/file/1063820502268406301" target="_blank" class="font-semibold u-text-gray-900 sm:text-lg">
        <Markdown :use="$slots.buttonText" unwrap="p" />
      </GradientNuxtLink>
    </template>

    <template #image>
      <img src="/assets/resources/design-kit/hero.png" alt="Design kit illustration" class="object-contain h-full mx-10 opacity-10 lg:opacity-100">
    </template>
  </PageHero>
</template>

<style scoped>
.transition-ease {
  transition-timing-function: cubic-bezier(0.83, 0, 0.17, 1);
}
</style>
