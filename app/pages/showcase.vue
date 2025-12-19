<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})

const [{ data: page }, { data: home }] = await Promise.all([
  useAsyncData('showcase', () => queryCollection('showcase').first()),
  useAsyncData('home', () => queryCollection('index').first())
])
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const stats = useStats()
const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
defineOgImageComponent('Docs', {
  headline: 'Resources',
  title,
  description
})

const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 768
})
</script>

<template>
  <div v-if="page">
    <UPageHero :title="page.title" :description="page.description" :ui="{ container: '!pb-12' }" />

    <UPage id="smooth" class="pt-20 -mt-20">
      <UPageBody>
        <UPageCTA
          variant="subtle"
          class="rounded-none"
          :ui="{
            container: 'sm:py-12 lg:py-12 sm:gap-8'
          }"
        >
          <template #description>
            <div class="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
              <div class="flex flex-col items-center">
                <h3 class="text-4xl font-bold text-primary">
                  #1
                </h3>
                <p class="text-sm text-muted">
                  Vue Framework
                </p>
              </div>
              <div class="flex flex-col items-center">
                <h3 class="text-4xl font-bold">
                  {{ formatNumber(stats.stars) }}
                </h3>
                <p class="text-sm text-muted">
                  GitHub Stars
                </p>
              </div>
              <div class="flex flex-col items-center">
                <h3 class="text-4xl font-bold">
                  {{ formatNumber(stats.monthlyDownloads) }}
                </h3>
                <p class="text-sm text-muted">
                  Monthly Downloads
                </p>
              </div>
            </div>
          </template>
        </UPageCTA>
        <UContainer>
          <UPageSection :ui="{ container: '!pt-0' }">
            <UPageLogos :marquee="isMobile" :title="home?.logos.title" :ui="{ title: 'text-muted font-medium text-lg', logos: 'mt-4' }">
              <Motion
                v-for="(company, index) in home?.logos.companies"
                :key="company.alt"
                as-child
                :initial="{ opacity: 0, transform: 'translateY(20px)' }"
                :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
                :transition="{ delay: 0.4 + 0.2 * index }"
                :in-view-options="{ once: true }"
              >
                <div class="opacity-0">
                  <UColorModeImage
                    :key="company.alt"
                    :light="company.light"
                    :dark="company.dark"
                    :alt="`${company.alt} logo`"
                    loading="lazy"
                    :height="company.height"
                    :width="company.width"
                    class="h-6 shrink-0 max-w-[140px]"
                  />
                </div>
              </Motion>
            </UPageLogos>
          </UPageSection>
          <UPageGrid class="bg-elevated/50 p-4 rounded-2xl gap-2">
            <UPageCard
              v-for="(website, index) in page.websites"
              :key="index"
              :to="website.url"
              target="_blank"
              variant="naked"
              class="overflow-hidden group rounded-lg"
            >
              <NuxtImg
                :src="getWebsiteScreenShotUrl(website)"
                :alt="website.name"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="object-cover object-top size-full opacity-100 group-hover:opacity-50 transition-opacity duration-300"
                width="576"
                height="324"
                sizes="575px sm:468px lg:443px"
                format="webp"
              />

              <p class="hidden absolute text-nowrap top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:flex bg-inverted text-inverted px-2.5 py-1 rounded-full text-sm font-medium font-mono items-center gap-1 shadow">
                {{ website.name }}

                <UIcon name="i-lucide-arrow-up-right" class="size-4" />
              </p>
            </UPageCard>
          </UPageGrid>
        </UContainer>
      </UPageBody>
    </UPage>
  </div>
</template>
