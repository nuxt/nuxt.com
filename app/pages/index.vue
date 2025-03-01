<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: 'z-10'
})
const uwuCookie = useCookie<boolean>('uwu-mode', {
  default: () => false
})

const route = useRoute()
if ('uwu' in route.query) {
  const enableUwu = !['0', 'false'].includes(route.query.uwu as string)
  uwuCookie.value = enableUwu
}

const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

const videoModalOpen = ref(false)

const site = useSiteConfig()
const title = 'Nuxt: The Intuitive Vue Framework'
const description = 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.'
useSeoMeta({
  title,
  ogTitle: title,
  description: description,
  ogDescription: description,
  ogImage: joinURL(site.url, '/new-social.jpg'),
  twitterImage: joinURL(site.url, '/new-social.jpg')
})

const tabs = computed(() => page.value?.hero.tabs.map(tab => ({
  label: tab.title,
  icon: tab.icon,
  slot: tab.title.toLowerCase(),
  content: tab.content
})))
</script>

<template>
  <div v-if="page" class="[--ui-container:100rem]">
    <UPageHero
      class="relative"
      orientation="horizontal"
    >
      <template #headline>
        <NuxtLink :to="page.hero.cta.to">
          <UBadge variant="subtle" size="lg" class="relative rounded-full font-semibold dark:hover:bg-primary-400/15 dark:hover:ring-primary-700">
            {{ page?.hero.cta.label }}
            <UIcon
              v-if="page?.hero.cta.icon"
              :name="page?.hero.cta.icon"
              class="ml-1 w-4 h-4 pointer-events-none"
            />
          </UBadge>
        </NuxtLink>
      </template>

      <template #title>
        <MDC :value="page?.hero.title" class="*:mb-0 *:text-6xl *:font-semibold" />
      </template>

      <template #description>
        <MDC :value="page?.hero.description" class="*:mt-0" />
      </template>

      <template #links>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <UButton to="/docs/getting-started/installation" trailing-icon="i-ph-arrow-right" size="lg">
              Get Started
            </UButton>
            <UButton size="lg" color="neutral" variant="ghost" trailing-icon="i-ph-play-circle" @click="videoModalOpen = true">
              Nuxt in 100 Seconds
            </UButton>
          </div>
          <UInputCopy value="npm create nuxt@latest" label="npm create nuxt@latest" />
        </div>

        <UModal v-model:open="videoModalOpen" :ui="{ content: 'sm:max-w-4xl lg:max-w-5xl aspect-[16/9]' }">
          <template #content>
            <div class="p-3 h-full">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube-nocookie.com/embed/dCxSsr5xuL8"
                title="Nuxt in 100 Seconds by Fireship"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
          </template>
        </UModal>
      </template>

      <NuxtImg
        v-if="uwuCookie"
        sizes="343px md:455px"
        width="455"
        height="256"
        class="mx-auto lg:my-16"
        src="/uwu.png"
        alt="Nuxt Logo in uwu style"
      />
      <UPageCard v-else class="bg-(--ui-primary) size-full">
        <template #title>
          <UTabs
            :items="tabs"
            :ui="{
              list: 'px-0 bg-transparent',
              trigger: 'group data-[state=active]:text-(--ui-text-highlighted) data-[state=inactive]:text-(--ui-bg)',
              indicator: 'bg-(--ui-bg)',
              leadingIcon: 'group-data-[state=active]:text-(--ui-primary)!'
            }"
          >
            <template v-for="(tab, index) of tabs" :key="index" #[tab.slot]="{ item }">
              <MDC :value="item.content" />
            </template>
          </UTabs>
        </template>
      </UPageCard>
    </UPageHero>
    <UContainer>
      <UPageLogos :title="page?.logos.title" :ui="{ title: 'text-left text-(--ui-text-muted)', logos: '' }">
        <NuxtImg
          v-for="company in page?.logos.companies"
          :key="company.alt"
          v-bind="company"
          class="h-6 shrink-0 max-w-[140px] filter invert dark:invert-0"
        />
      </UPageLogos>
      <UPageSection
        :title="page?.features.title"
        :description="page?.features.description"
        :ui="{
          title: 'text-left lg:text-4xl',
          description: 'text-left',
          container: 'py-6 pb-12 sm:px-0 lg:px-0',
          features: 'xl:grid-cols-4'
        }"
      >
        <template #features>
          <UPageFeature
            v-for="(feature, index) in page.features.features"
            :key="index"
            v-bind="feature"
            orientation="vertical"
            class="p-4"
            :class="feature.title === 'Modular' ? 'bg-(--ui-bg-muted)/40' : ''"
          />
          <div class="flex flex-col justify-center gap-4 p-4">
            <span class="text-lg font-semibold">
              {{ page.features.cta.title }}
            </span>
            <div>
              <UButton :to="page.features.cta.to" :label="page.features.cta.label" trailing :icon="page.features.cta.icon" />
            </div>
          </div>
        </template>
      </UPageSection>
    </UContainer>
  </div>
</template>
