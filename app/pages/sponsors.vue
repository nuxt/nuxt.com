<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const [{ data: page }, { data: sponsors }] = await Promise.all([
  useAsyncData('sponsors-landing', () => useContent('site').get('/sponsors')),
  useFetch<SponsorsByTier>('/api/sponsors', { key: 'sponsors' })
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const pageData = computed(() => page.value!.data)

const { data: pastSponsors } = useFetch<PastSponsor[]>('/api/sponsors/past', { key: 'sponsors-past', lazy: true })

const featuredTiers = ['diamond', 'platinum']

const tiers = computed(() => Object.entries(sponsors.value || {})
  .filter(([, tierSponsors]) => tierSponsors.length > 0)
  .map(([tier, tierSponsors]) => ({ tier, sponsors: tierSponsors })))

const title = pageData.value.head?.title || pageData.value.title
const description = pageData.value.head?.description || pageData.value.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()

defineOgImage('Docs.takumi', {
  headline: 'Sponsors',
  title,
  description
})
</script>

<template>
  <UPage v-if="pageData">
    <UPageHero
      :title="pageData.title"
      :description="pageData.description"
      :links="pickLinks(pageData.links)"
    />

    <UPageBody class="relative">
      <UContainer class="divide-y divide-default">
        <div v-for="{ tier, sponsors: tierSponsors } of tiers" :key="tier" class="relative grid lg:grid-cols-5 gap-8 py-16">
          <div class="lg:self-start flex lg:flex-col items-center lg:items-start justify-between lg:sticky lg:top-0 lg:pt-16 lg:-mt-16">
            <h2 class="capitalize font-bold text-2xl text-highlighted">
              {{ tier }}
            </h2>
          </div>

          <div class="lg:col-span-4">
            <SponsorsGrid
              v-if="['diamond', 'platinum', 'gold', 'silver'].includes(tier)"
              :sponsors="tierSponsors"
              :featured="featuredTiers.includes(tier)"
              :columns="featuredTiers.includes(tier) ? 2 : 3"
              class="border border-default rounded-lg overflow-hidden"
            />
            <div v-else class="flex flex-wrap gap-8">
              <NuxtLink v-for="(sponsor, index) in tierSponsors" :key="index" :to="sponsor.sponsorUrl" target="_blank" class="inline-flex">
                <span class="sr-only">Visit {{ sponsor.sponsorName }} profile</span>
                <UAvatar
                  :src="sponsor.sponsorLogo"
                  size="lg"
                  :class="{ 'size-16': tier === 'bronze' }"
                  :alt="`${sponsor.sponsorName} avatar`"
                />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="pastSponsors?.length" class="relative grid lg:grid-cols-5 gap-8 py-16">
          <div class="lg:self-start lg:sticky lg:top-0 lg:pt-16 lg:-mt-16">
            <h2 class="font-bold text-2xl text-highlighted">
              Past sponsors
            </h2>
          </div>

          <div class="lg:col-span-4">
            <p class="text-muted mb-8">
              Thank you to the companies that helped build Nuxt over the years.
            </p>
            <div class="flex flex-wrap gap-x-8 gap-y-6">
              <NuxtLink
                v-for="sponsor in pastSponsors"
                :key="sponsor.sponsorId"
                :to="sponsor.sponsorUrl"
                target="_blank"
                class="group inline-flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity"
              >
                <UAvatar
                  :src="sponsor.sponsorLogo"
                  size="lg"
                  class="grayscale group-hover:grayscale-0 transition"
                  :alt="`${sponsor.sponsorName} logo`"
                />
                <span class="text-sm font-medium text-toned">{{ sponsor.sponsorName }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
