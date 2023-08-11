<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const { data: sponsors } = await useFetch('https://api.nuxt.com/sponsors')

useContentHead(page)
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage
        v-if="page.image"
        :light="`${page.image.path}-light.${page.image.format}`"
        :dark="`${page.image.path}-dark.${page.image.format}`"
        class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100"
        :width="page.image.width"
        :height="page.image.height"
      />
    </UPageHero>

    <UPage>
      <UPageBody class="divide-y">
        <div v-for="([key, value]) of Object.entries(sponsors)" :key="key" class="relative grid lg:grid-cols-5 gap-8 py-24">
          <div class="lg:self-start flex lg:flex-col items-center lg:items-start justify-between lg:sticky lg:top-0 lg:pt-24 lg:-mt-24">
            <h2 class="capitalize font-bold text-2xl text-gray-900 dark:text-white">
              {{ key }}
            </h2>
          </div>

          <div class="lg:col-span-4">
            <div v-if="['platinum', 'gold', 'silver'].includes(key)" class="grid grid-cols-2 gap-8 gap-x-4 sm:grid-cols-3 md:grid-cols-4 -mt-4">
              <UButton
                v-for="(sponsor, index) in value"
                :key="index"
                color="white"
                variant="ghost"
                class="flex-col flex-1 justify-center"
                size="xl"
                :to="sponsor.sponsorUrl"
                target="_blank"
              >
                <UAvatar :src="sponsor.sponsorLogo" :alt="sponsor.sponsorName" class="mx-auto mt-4" size="2xl" />
                <h3 class="mt-6 font-semibold leading-7 tracking-tight text-gray-900 dark:text-white mb-2">
                  {{ sponsor.sponsorName }}
                </h3>
              </UButton>
            </div>
            <div v-else class="flex flex-wrap gap-8 ml-12">
              <NuxtLink v-for="(sponsor, index) in value" :key="index" :to="sponsor.sponsorUrl" target="_blank" class="inline-flex">
                <UAvatar :src="sponsor.sponsorLogo" :alt="sponsor.sponsorName" size="lg" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
