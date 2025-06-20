<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const [{ data: page }, { sponsors }] = await Promise.all([
  useAsyncData('sponsors-landing', () => queryCollection('landing').path('/enterprise/sponsors').first()),
  useSponsors()
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description
useSeoMeta({
  titleTemplate: '%s · Community',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Community`
})

defineOgImageComponent('Docs', {
  headline: 'Community',
  title,
  description
})
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="title"
      :description="description"
      :links="page.links"
    />

    <UPage>
      <UPageBody class="relative divide-y divide-default">
        <div v-for="([key, value]) of Object.entries(sponsors)" :key="key" class="relative grid lg:grid-cols-5 gap-8 py-24">
          <div class="lg:self-start flex lg:flex-col items-center lg:items-start justify-between lg:sticky lg:top-0 lg:pt-24 lg:-mt-24">
            <h2 class="capitalize font-bold text-2xl text-highlighted">
              {{ key }}
            </h2>
          </div>

          <div class="lg:col-span-4">
            <div v-if="['diamond', 'platinum', 'gold', 'silver'].includes(key)" class="w-full border border-default rounded-lg">
              <table class="w-full">
                <tbody>
                  <template v-for="(_, rowIndex) in Math.ceil(value.length / 3)" :key="rowIndex">
                    <tr>
                      <template v-for="colIndex in 3" :key="colIndex">
                        <td
                          v-if="(rowIndex * 3) + colIndex - 1 < value.length"
                          class="border-b border-r border-default p-0 w-1/3 h-[120px]"
                          :class="{
                            'border-r-0': colIndex === 3,
                            'border-b-0': rowIndex === Math.ceil(value.length / 3) - 1
                          }"
                        >
                          <NuxtLink
                            :to="value[(rowIndex * 3) + colIndex - 1].sponsorUrl"
                            target="_blank"
                            class="flex items-center gap-2 justify-center h-full hover:bg-muted/50 transition-colors"
                          >
                            <NuxtImg
                              :src="value[(rowIndex * 3) + colIndex - 1].sponsorLogo"
                              :alt="`${value[(rowIndex * 3) + colIndex - 1].sponsorName} logo`"
                              class="h-10 max-w-[140px] object-contain rounded-lg"
                              height="40"
                              width="40"
                            />
                            <span class="text-base hidden sm:block font-semibold truncate">{{ value[(rowIndex * 3) + colIndex - 1].sponsorName }}</span>
                          </NuxtLink>
                        </td>
                        <td
                          v-else
                          class="border-b border-r border-default p-0 w-1/3 h-[120px]"
                          :class="{
                            'border-r-0': colIndex === 3,
                            'border-b-0': rowIndex === Math.ceil(value.length / 3) - 1
                          }"
                        >
                          <div class="h-full" />
                        </td>
                      </template>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div v-else class="flex flex-wrap gap-8">
              <NuxtLink v-for="(sponsor, index) in value" :key="index" :to="sponsor.sponsorUrl" target="_blank" class="inline-flex">
                <span class="sr-only">Visit {{ sponsor.sponsorName }} profile</span>
                <UAvatar :src="sponsor.sponsorLogo" size="lg" :alt="`${sponsor.sponsorName} avatar`" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
