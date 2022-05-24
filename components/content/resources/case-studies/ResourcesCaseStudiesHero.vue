<template>
  <PageHero centered description-width-class="sm:max-w-2xl">
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>
  </PageHero>
</template>
