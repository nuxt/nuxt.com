<template>
  <PageHero centered description-width-class="sm:max-w-2xl">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
  </PageHero>
</template>
