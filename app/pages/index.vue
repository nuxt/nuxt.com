<script setup lang="ts">
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: '-z-10'
})

const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

const { fetchList, modules } = useModules()

await fetchList()

const officialModules = computed(() => {
  return modules.value
    .filter(module => module.type === 'official')
    .sort((a, b) => b.stats.stars - a.stats.stars)
})

const { data: sponsors } = await useFetch('https://api.nuxt.com/sponsors')

const stats = useStats()

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
  content: tab.content // TODO: fix
})))

const activeBundlerIndex = ref(0)

const groupedFoundationItems = computed(() => {
  const result = []
  const bundlers = {
    id: 'bundler',
    items: [],
    classes: 'rounded-none'
  }

  page.value.foundation.items.forEach((item, index) => {
    if (item.id === 'bundler') {
      bundlers.items.push(item)
    } else {
      const borderClasses = index === 0
        ? 'max-sm:rounded-t-lg max-sm:rounded-b-none sm:rounded-s-lg sm:rounded-e-none'
        : index === page.value.foundation.items.length - 1
          ? 'max-sm:rounded-t-none max-sm:rounded-b-lg sm:rounded-s-none sm:rounded-e-lg'
          : 'rounded-none'

      result.push({
        id: item.id,
        item: item,
        classes: `${borderClasses} ${item.gradient}`
      })
    }
  })

  if (bundlers.items.length > 0) {
    result.splice(1, 0, bundlers)
  }

  return result
})

const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.innerWidth < 768
})
</script>

<template>
  <div v-if="page">
    <UPageHero
      class="relative"
      orientation="horizontal"
      :ui="{
        container: '!pb-20 py-24 sm:py-32 lg:py-40',
        title: 'text-5xl sm:text-7xl',
        wrapper: 'lg:min-h-[540px]'
      }"
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
        The Intuitive<br><span class="text-(--ui-primary)">Web Framework</span>
      </template>

      <template #description>
        <MDC :value="page?.hero.description" unwrap="p" />
      </template>

      <template #links>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <UButton to="/docs/getting-started/installation" trailing-icon="i-ph-arrow-right" size="xl">
              Get Started
            </UButton>
            <UButton size="xl" color="neutral" variant="ghost" trailing-icon="i-ph-play-circle" @click="videoModalOpen = true">
              Nuxt in 100 Seconds
            </UButton>
          </div>
          <UInputCopy value="npm create nuxt@latest" label="npm create nuxt@latest" size="xl" />
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

      <UPageCard
        class="overflow-auto lg:absolute lg:-mt-16 right-0 w-screen lg:w-[calc(50%-2rem)] rounded-none lg:rounded-l-[calc(var(--ui-radius)*4)] -mx-4 sm:-mx-6 lg:mx-0"
        variant="subtle"
        :ui="{ container: 'sm:pt-4.5 lg:pr-0 w-full' }"
      >
        <UTabs
          :items="tabs"
          :unmount-on-hide="false"
          :ui="{
            list: 'px-0 bg-transparent lg:pr-4 overflow-x-auto items-stretch',
            trigger: 'group data-[state=active]:text-(--ui-text-highlighted)',
            indicator: 'bg-(--ui-bg)',
            leadingIcon: 'group-data-[state=active]:text-(--ui-primary) size-4 hidden sm:inline-flex',
            label: 'text-clip',
            content: 'lg:h-[450px] bg-(--ui-bg) rounded-[calc(var(--ui-radius)*1.5)] transition-opacity duration-500 data-[state=inactive]:opacity-0 opacity-100'
          }"
        >
          <template v-for="(tab, index) of tabs" :key="index" #[tab.slot]="{ item }">
            <MDC :value="item.content" class="//" />
          </template>
        </UTabs>
      </UPageCard>
    </UPageHero>
    <UPageSection :ui="{ container: '!pt-0' }">
      <UPageLogos :marquee="isMobile" :title="page?.logos.title" :ui="{ title: 'text-left text-(--ui-text-muted) font-medium text-lg', logos: 'mt-4' }">
        <Motion
          v-for="(company, index) in page?.logos.companies"
          :key="company.alt"
          as-child
          :initial="{ opacity: 0, transform: 'translateY(20px)' }"
          :in-view="{ opacity: 0.8, transform: 'translateY(0)' }"
          :transition="{ delay: 0.4 + 0.2 * index }"
          :in-view-options="{ once: true }"
        >
          <NuxtImg
            :key="company.alt"
            v-bind="company"
            class="opacity-0 h-6 shrink-0 max-w-[140px] grayscale filter dark:invert invert-0"
          />
        </Motion>
      </UPageLogos>
    </UPageSection>
    <UPageSection
      :title="page?.features.title"
      :description="page?.features.description"
      :ui="{
        title: 'text-left lg:text-4xl',
        description: 'text-left',
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)',
        features: 'xl:grid-cols-4 lg:gap-10'
      }"
    >
      <template #features>
        <UPageFeature
          v-for="(feature, index) in page.features.features"
          :key="index"
          v-bind="feature"
          orientation="vertical"
        />
        <div class="flex flex-col justify-center gap-4 p-4 bg-(--ui-bg-muted)/50 h-full">
          <span class="text-lg font-semibold">
            {{ page.features.cta.title }}
          </span>
          <div>
            <UButton :to="page.features.cta.to" :label="page.features.cta.label" trailing :icon="page.features.cta.icon" />
          </div>
        </div>
      </template>
    </UPageSection>

    <UPageSection
      :ui="{
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)'
      }"
    >
      <template #title>
        <MDC :value="page.foundation.title" unwrap="p" />
      </template>
      <template #description>
        <MDC :value="page.foundation.description" unwrap="p" />
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-3">
        <template v-for="(group, groupIndex) in groupedFoundationItems" :key="groupIndex">
          <UPageCard
            v-if="group.id !== 'bundler'"
            :title="group.item.title"
            :description="group.item.description"
            class="h-full"
            :ui="{
              root: group.classes,
              title: 'text-lg font-semibold'
            }"
          >
            <template #leading>
              <UIcon :name="group.item.logo" class="size-6" />
            </template>
            <ULink :to="group.item.link.to" :style="{ color: group.item.color }">
              {{ group.item.link.label }}
            </ULink>
          </UPageCard>

          <UPageCard
            v-else
            :title="group.items[activeBundlerIndex].title"
            :description="group.items[activeBundlerIndex].description"
            class="h-full"
            :ui="{
              root: group.classes + ' ' + group.items[activeBundlerIndex].gradient,
              title: 'text-lg font-semibold'
            }"
          >
            <template #leading>
              <div class="flex items-center space-x-1">
                <div
                  v-for="(bundler, bIndex) in group.items"
                  :key="bIndex"
                  class="size-7 justify-center inline-flex items-end"
                >
                  <UIcon
                    :name="bundler.logo"
                    class="cursor-pointer transition-all duration-300 ease-in-out"
                    :class="bIndex === activeBundlerIndex
                      ? 'size-7 opacity-100'
                      : 'size-6 opacity-50 grayscale hover:size-6.5'"
                    @click="activeBundlerIndex = bIndex"
                  />
                </div>
              </div>
            </template>
            <ULink
              :to="group.items[activeBundlerIndex].link.to"
              :style="{ color: group.items[activeBundlerIndex].color }"
            >
              {{ group.items[activeBundlerIndex].link.label }}
            </ULink>
          </UPageCard>
        </template>
      </div>
    </UPageSection>
    <UPageCTA
      :description="page.testimonial.quote"
      variant="subtle"
      class="rounded-none"
      :ui="{ container: 'sm:py-12 lg:py-12 sm:gap-8', description: 'before:content-[open-quote] after:content-[close-quote] !text-base' }"
    >
      <UUser
        v-bind="page.testimonial.author"
        size="xl"
        class="justify-center"
      />
    </UPageCTA>
    <UPageSection
      :description="page.modules.description"
      :links="page.modules.links"
      :ui="{
        title: 'text-left sm:text-4xl lg:text-5xl font-semibold',
        description: 'text-left',
        links: 'justify-start'
      }"
    >
      <template #title>
        <MDC :value="page.modules.title" unwrap="p" />
      </template>
      <UCarousel
        v-slot="{ item }"
        dots
        wheel-gestures
        arrows
        :items="officialModules"
        class="bg-(--ui-primary) min-w-0 lg:rounded-lg p-4 -mx-4 sm:p-6 sm:-mx-6 lg:p-8 lg:-mx-8"
        :ui="{
          item: 'min-w-0 shrink-0 sm:basis-1/3',
          arrows: 'hidden 2xl:block'
        }"
      >
        <ModuleItem :module="item" :show-badge="false" class="min-h-[180px]" />
      </UCarousel>
    </UPageSection>

    <UPageSection
      :title="page.deploy.title"
      :description="page.deploy.description"
      :links="page.deploy.links"
      orientation="horizontal"
      :ui="{
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)',
        title: 'sm:text-3xl lg:text-4xl font-semibold'
      }"
    >
      <NuxtImg
        src="/assets/landing/deploy.svg"
        alt="Deploy anywhere"
        class="mx-auto max-w-lg sm:w-full"
      />
    </UPageSection>

    <UPageSection
      :title="page.stats.title"
      :description="page.stats.description"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)',
        title: 'sm:text-3xl lg:text-4xl font-semibold'
      }"
    >
      <div class="flex flex-col md:flex-row gap-4">
        <div class="md:w-1/4 flex flex-col gap-4">
          <UPageCard class="flex-1" variant="subtle" to="https://npm.chart.dev/nuxt">
            <div class="flex items-center gap-3">
              <div class="rounded-[calc(var(--ui-radius)*2)] bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-npm" class="text-red-500 size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-lg text-(--ui-text-highlighted)">
                  {{ formatNumber(stats.monthlyDownloads) }}
                </span>
                <p class="text-sm">
                  Monthly downloads
                </p>
              </div>
            </div>
          </UPageCard>

          <UPageCard class="flex-1" variant="subtle" to="https://go.nuxt.com/github">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-github" class="size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-lg text-(--ui-text-highlighted)">
                  {{ formatNumber(stats.stars) }}
                </span>
                <p class="text-sm">
                  GitHub Stars
                </p>
              </div>
            </div>
          </UPageCard>
        </div>

        <div class="md:w-1/2">
          <UPageCard class="h-full" variant="subtle" to="https://go.nuxt.com/github">
            <div class="flex flex-col items-center justify-around h-full">
              <span class="text-xl font-semibold">
                {{ page.stats.community.title }}
              </span>
              <p class="text-(--ui-text-muted) text-center">
                {{ page.stats.community.description }}
              </p>
              <UButton class="mt-4 w-fit" v-bind="page.stats.cta" />
            </div>
          </UPageCard>
        </div>

        <div class="md:w-1/4 flex flex-col gap-4">
          <UPageCard class="flex-1" variant="subtle" to="https://go.nuxt.com/x">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-x" class="size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium">
                  {{ page.stats.x }}
                </span>
                <p>Followers</p>
              </div>
            </div>
          </UPageCard>

          <UPageCard class="flex-1" variant="subtle" to="https://go.nuxt.com/discord">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-discord" class="text-indigo-400 size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium">
                  {{ page.stats.discord }}
                </span>
                <p>Members</p>
              </div>
            </div>
          </UPageCard>
        </div>
      </div>
    </UPageSection>

    <UPageSection
      :title="page.expertise.title"
      :description="page.expertise.description"
      :links="page.expertise.links"
      orientation="horizontal"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)',
        title: 'text-left sm:text-3xl lg:text-4xl font-semibold',
        description: 'text-left',
        links: 'justify-start'
      }"
    >
      <template #title>
        <MDC :value="page.expertise.title" unwrap="p" />
      </template>
      <template #description>
        <MDC :value="page.expertise.description" unwrap="p" />
        <UPageLogos :ui="{ logos: 'mt-4' }">
          <NuxtImg
            v-for="company in page.expertise.companies"
            :key="company.alt"
            v-bind="company"
            class="h-8 max-w-[70px] object-contain filter invert dark:invert-0 opacity-50"
          />
        </UPageLogos>
      </template>

      <div class="flex flex-col gap-6">
        <UPageFeature
          v-for="(feature, index) in page.expertise.features"
          :key="index"
          v-bind="feature"
        />
      </div>
    </UPageSection>

    <UPageSection
      :title="page.sponsors.title"
      :description="page.sponsors.description"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-(--ui-border) from-(--ui-bg-muted) dark:from-(--ui-bg-muted)/40 to-(--ui-bg)',
        container: 'py-12 sm:py-16 lg:py-20',
        title: 'sm:text-3xl lg:text-4xl font-semibold'
      }"
    >
      <div class="flex flex-col items-center">
        <template v-for="([key, value]) of Object.entries(sponsors).filter(([k]) => ['platinum', 'gold'].includes(k))" :key="key">
          <div class="w-full mb-24">
            <UBadge color="neutral" variant="subtle" class="capitalize mb-2">
              {{ key }} sponsors
            </UBadge>

            <div class="w-full border border-(--ui-border) rounded-lg">
              <table class="w-full">
                <tbody>
                  <template v-for="(_, rowIndex) in Math.ceil(value.length / 3)" :key="rowIndex">
                    <tr>
                      <template v-for="colIndex in 3" :key="colIndex">
                        <td
                          v-if="(rowIndex * 3) + colIndex - 1 < value.length"
                          class="border-b border-r border-(--ui-border) p-0 w-1/3 h-[120px]"
                          :class="{
                            'border-r-0': colIndex === 3,
                            'border-b-0': rowIndex === Math.ceil(value.length / 3) - 1
                          }"
                        >
                          <NuxtLink
                            :to="value[(rowIndex * 3) + colIndex - 1].sponsorUrl"
                            target="_blank"
                            class="flex items-center gap-2 justify-center h-full hover:bg-(--ui-bg-muted)/50 transition-colors"
                          >
                            <NuxtImg
                              :src="value[(rowIndex * 3) + colIndex - 1].sponsorLogo"
                              :alt="value[(rowIndex * 3) + colIndex - 1].sponsorName"
                              class="h-10 max-w-[140px] object-contain rounded-[calc(var(--ui-radius)*2)]"
                            />
                            <span class="text-base hidden sm:block font-medium">{{ value[(rowIndex * 3) + colIndex - 1].sponsorName }}</span>
                          </NuxtLink>
                        </td>
                        <td
                          v-else
                          class="border-b border-r border-(--ui-border) p-0 w-1/3 h-[120px]"
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
          </div>
        </template>

        <UButton v-bind="page.sponsors.cta" />
      </div>
    </UPageSection>
  </div>
</template>
