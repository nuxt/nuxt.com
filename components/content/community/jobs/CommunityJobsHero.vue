<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <UButton to="https://vuejobs.com/jobs/create" target="_blank" variant="primary-gradient" label="Post a job" class="self-start" />

      <img src="/assets/community/jobs/gem-left.png" alt="hero gem left" class="absolute z-[-1] sm:top-[96px] left-[24px] sm:left-[48px] lg:left-[96px] w-[120px] opacity-40 lg:opacity-100">

      <img src="/assets/community/jobs/gem-right.png" alt="hero gem right" class="absolute z-[-1] sm:top-[36px] right-[32px] sm:right-[64px] lg:right-[128px] w-[91px] opacity-40 lg:opacity-100">
    </template>
  </PageHero>
</template>
