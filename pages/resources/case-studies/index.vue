<template>
  <div>
    <UContainer padded>
      <div class="text-center py-12 md:py-20">
        <h1 class="text-4xl tracking-tight font-extrabold u-text-gray-900 sm:text-5xl">
          Our users have something to say
        </h1>
        <p class="mt-3 max-w-md mx-auto text-base u-text-gray-500 sm:text-lg md:mt-5 md:max-w-2xl">
          Nuxt helps you to build modern websites in a short amount of time, here’s how biggest entreprises make it work.
        </p>
      </div>

      <ul role="list" class="grid sm:grid-cols-2 gap-4 md:grid-cols-3 sm:gap-6 md:gap-x-12 md:gap-y-10">
        <li v-for="page in pages" :key="page.slug" class="relative">
          <div class="ring-1 u-ring-gray-200 lg:hover:u-ring-gray-900 lg:hover:ring-2 group block w-full aspect-w-16 aspect-h-7 rounded-lg u-bg-gray-100 overflow-hidden">
            <img :src="page.imgUrl" alt="" class="group-hover:scale-110 duration-300 transition-all object-contain object-center pointer-events-none bg-white">
            <NuxtLink :to="page.slug" tabindex="-1" class="focus:outline-none">
              <span class="absolute inset-0" aria-hidden="true" />
            </NuxtLink>
          </div>
        </li>
      </ul>
    </UContainer>
    <ResourcesCaseStudiesCTA />
  </div>
</template>

<script setup>
const { fetchDir } = useContent()

const { data: pages } = await useAsyncData('resources-case-studies', () => fetchDir('/resources/case-studies'))
</script>
