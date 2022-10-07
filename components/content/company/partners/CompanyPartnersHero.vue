<template>
  <PageHero :centered="true">
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>
    <template #background>
      <div class="relative w-full h-full">
        <div class="absolute w-[441px] h-[388px] bg-gradient-to-t from-white dark:from-black to-transparent" />
        <CompanyPartnersNuxtHero class="u-text-gray-300" />
      </div>
    </template>
  </PageHero>
</template>
