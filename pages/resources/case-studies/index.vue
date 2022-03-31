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

    <div class="bg-black mt-12 sm:mt-24 relative overflow-hidden dark">
      <UContainer padded class="py-12 lg:py-16 lg:flex lg:items-center lg:justify-between relative">
        <span class="_ellipse z-0" />
        <h2 class="text-white z-[1] tracking-tight">
          <span class="block font-semibold text-2xl">Contact us</span>
          <span class="block mt-2">Start building, or get in touch with our app experts.</span>
        </h2>
        <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3 z-[1] relative">
          <UButton label="Contact" />
          <UButton label="Get started" variant="secondary" />
        </div>
      </UContainer>
    </div>
  </div>
</template>

<script setup>
const { data: pages } = await useAsyncData('resources-case-studies', () => queryContent('/resources/case-studies').find())
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
