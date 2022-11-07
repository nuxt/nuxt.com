<template>
  <PageHero>
    <template #title>
      Modules
    </template>
    <template #description>
      Discover our list of modules to supercharge your Nuxt project. Created by the Nuxt team and community.
    </template>
    <template #image>
      <div class="h-full flex items-center justify-center">
        <img src="/assets/modules/hero-light.svg" class="dark:hidden object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
        <img src="/assets/modules/hero-dark.svg" class="hidden dark:block object-cover h-3/4 lg:mx-10 opacity-0 md:opacity-100" role="presentation">
      </div>
    </template>
  </PageHero>
</template>
