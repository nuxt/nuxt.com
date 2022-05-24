<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #background>
      <img src="/assets/company/about/gems.svg" class="object-cover h-full">
      <div class="h-[200px] w-full absolute -top-16 right-0 bg-gradient-to-b from-white dark:from-black to-transparent picture-overlay-top" />
      <div class="h-[200px] w-full absolute -bottom-16 left-0 bg-gradient-to-t from-white dark:from-black to-transparent picture-overlay-bottom" />
    </template>
  </PageHero>
</template>

<style scoped>
.picture-overlay-top {
  transform: translateX(10%) rotate(10deg);
}
.picture-overlay-bottom {
  transform: translateX(-15%) rotate(20deg);
}
</style>
