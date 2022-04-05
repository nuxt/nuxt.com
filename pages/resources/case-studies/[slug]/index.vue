<template>
  <div v-if="page" class="pb-12 sm:pb-24">
    <div class="py-10 sm:py-20 relative overflow-hidden">
      <img :src="page.gradientUrl" alt="" class="z-0 absolute inset-x-0 bottom-0 translate-y-1/4 w-full">

      <UContainer padded constrained-class="max-w-4xl" class="z-[1] relative">
        <h1 class="text-4xl tracking-tight font-bold u-text-gray-900 sm:text-5xl">
          {{ page.title }}
        </h1>
        <p class="mt-3 text-base u-text-gray-600 sm:text-lg md:mt-5 text-justify">
          {{ page.description }}
        </p>
        <NuxtLink :to="page.url" target="_blank" class="inline-flex items-center mt-3 md:mt-5 font-bold hover:underline">
          See website
          <UIcon name="heroicons-outline:arrow-sm-right" class="w-4 h-4 ml-1" />
        </NuxtLink>
      </UContainer>
    </div>

    <Content v-if="page" :document="page" />

    <UContainer constrained-class="max-w-4xl">
      <div class="dark py-10">
        <UCard class="relative">
          <span class="_ellipse z-0" />
          <div class="flex items-center justify-between">
            <h2 class="text-white z-[1] tracking-tight">
              <span class="block font-semibold text-2xl">Contact us</span>
              <span class="block mt-2">Start building, or get in touch with our app experts.</span>
            </h2>
            <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3 z-[1] relative">
              <UButton label="Get in touch" variant="secondary" />
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex items-center justify-between">
        <div v-if="previous" class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group rounded-lg u-bg-white overflow-hidden relative px-6 py-3">
          <div class="flex items-center justify-between gap-6">
            <UIcon name="heroicons-outline:arrow-sm-left" class="w-5 h-5" />

            <div>
              <p class="text-lg font-semibold u-text-gray-900">
                Previous case
              </p>
              <p class="u-text-gray-600">
                {{ previous.title }} study
              </p>
            </div>
          </div>
          <NuxtLink :to="previous.slug" tabindex="-1" class="focus:outline-none">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>
        </div>
        <span v-else>&nbsp;</span>

        <div v-if="next" class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group rounded-lg u-bg-white overflow-hidden relative px-6 py-3">
          <div class="flex items-center justify-between gap-6">
            <div>
              <p class="text-lg font-semibold u-text-gray-900">
                Next case
              </p>
              <p class="u-text-gray-600">
                {{ next.title }} study
              </p>
            </div>

            <UIcon name="heroicons-outline:arrow-sm-right" class="w-5 h-5" />
          </div>
          <NuxtLink :to="next.slug" tabindex="-1" class="focus:outline-none">
            <span class="absolute inset-0" aria-hidden="true" />
          </NuxtLink>
        </div>
        <span v-else>&nbsp;</span>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['content']
})

const { previous, next, page } = useContentPage()
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 480.14px;
  height: 161.22px;
  left: 0;
  top: 0;
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 1) 2.27%, rgba(26, 214, 255, 1) 50.88%, rgba(0, 220, 130, 1) 98.48%);
  filter: blur(150px);
  transform: matrix(-0.97, 0.24, 0.24, 0.97, 0, 0);
}
</style>
