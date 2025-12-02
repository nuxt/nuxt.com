<script setup lang="ts">
import { joinURL } from 'ufo'
import type { Module } from '#shared/types'

definePageMeta({
  heroBackground: '-z-10'
})

const [{ data: page }, { data: officialModules }, { data: showcase }, { getFilteredSponsors }] = await Promise.all([
  useAsyncData('index', () => queryCollection('index').first()),
  useFetch('/api/modules', {
    key: 'official-modules',
    transform: (res: { modules: Module[], stats: Stats }) => res.modules
      .filter(module => module.type === 'official')
      .sort((a, b) => b.stats.stars - a.stats.stars)
  }),
  useAsyncData('showcase', () => queryCollection('showcase').first()),
  useSponsors()
])

const sponsorGroups = getFilteredSponsors(['diamond', 'platinum', 'gold'])

const stats = useStats()

const videoModalOpen = ref(false)

const site = useSiteConfig()
const title = 'Nuxt: The Progressive Web Framework'
useSeoMeta({
  title,
  titleTemplate: '%s'
})

if (import.meta.server) {
  const description = 'Create high-quality web applications with Nuxt, the open source framework that makes full-stack development with Vue.js intuitive.'
  useSeoMeta({
    ogTitle: title,
    description: description,
    ogDescription: description,
    ogImage: joinURL(site.url, '/new-social.jpg'),
    twitterImage: joinURL(site.url, '/new-social.jpg')
  })
}

const tabs = computed(() => page.value?.hero.tabs.map(tab => ({
  label: tab.title,
  icon: tab.icon,
  content: tab.content
})))

const activeBundlerIndex = ref(0)

const groupedFoundationItems = computed(() => {
  const result = [] as Array<{
    id: string
    // TODO: make these types better
    item?: any
    items?: any[]
    classes: string
  }>
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
          <UBadge variant="subtle" size="lg" class="px-3 relative rounded-full font-semibold dark:hover:bg-primary-400/15 dark:hover:ring-primary-700">
            {{ page?.hero.cta.label }}
            <UIcon
              v-if="page?.hero.cta.icon"
              :name="page?.hero.cta.icon"
              class="size-4 pointer-events-none"
            />
          </UBadge>
        </NuxtLink>
      </template>

      <template #title>
        The Progressive<br><span class="text-primary">Web Framework</span>
      </template>

      <template #description>
        <LazyMDC :value="page?.hero.description" unwrap="p" cache-key="index-hero-description" hydrate-never />
      </template>

      <template #links>
        <div class="flex flex-col gap-4">
          <div class="flex items-center flex-wrap gap-2">
            <UButton to="/docs/getting-started/installation" size="xl">
              Get started
            </UButton>
            <UButton size="xl" color="neutral" variant="subtle" trailing-icon="i-lucide-play-circle" @click="videoModalOpen = true">
              Nuxt in 100 seconds
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
        class="overflow-auto lg:absolute [@media(min-width:2400px)]:relative lg:-mt-16 [@media(min-width:2400px)]:mt-8 right-0 [@media(min-width:2400px)]:right-auto w-screen lg:w-[calc(50%-2rem)] [@media(min-width:2400px)]:w-full max-w-[800px] [@media(min-width:2400px)]:mx-auto rounded-none lg:rounded-l-[calc(var(--ui-radius)*4)] [@media(min-width:2400px)]:rounded-2xl -mx-4 sm:-mx-6 lg:mx-0"
        variant="subtle"
        :ui="{ container: 'sm:pt-4.5 lg:pr-0 [@media(min-width:2400px)]:px-6 w-full' }"
      >
        <UTabs
          :items="tabs"
          :unmount-on-hide="false"
          :ui="{
            list: 'px-0 bg-transparent lg:pr-4 overflow-x-auto',
            trigger: 'group data-[state=active]:text-highlighted',
            indicator: 'bg-default',
            leadingIcon: 'group-data-[state=active]:text-primary size-4 hidden sm:inline-flex',
            content: 'lg:h-[450px] bg-default [@media(min-width:2400px)]:border-e [@media(min-width:2400px)]:border-default [@media(min-width:2400px)]:rounded-l-[calc(var(--ui-radius)*1.5)] transition-opacity duration-500 data-[state=inactive]:opacity-0 opacity-100'
          }"
        >
          <template #content="{ item, index }">
            <LazyMDC :value="item.content" :cache-key="`index-hero-tab-${index}`" hydrate-on-idle />
          </template>
        </UTabs>
      </UPageCard>
    </UPageHero>
    <UPageSection :ui="{ container: '!pt-0' }">
      <UPageLogos :marquee="isMobile" :title="page?.logos.title" :ui="{ title: 'text-left text-muted font-medium text-lg', logos: 'mt-4' }">
        <Motion
          v-for="(company, index) in page?.logos.companies"
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
    <UPageSection
      :title="page?.features.title"
      :description="page?.features.description"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default',
        features: 'xl:grid-cols-4 lg:gap-10'
      }"
    >
      <template #features>
        <Motion
          v-for="(feature, index) in page.features.features"
          :key="feature.title"
          as="li"
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 * index }"
          :in-view-options="{ once: true }"
        >
          <UPageFeature
            v-bind="feature"
            orientation="vertical"
          />
        </Motion>
        <Motion
          as="li"
          :initial="{ opacity: 0, transform: 'translateY(10px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.1 * page.features.features.length }"
          :in-view-options="{ once: true }"
          class="flex flex-col justify-center gap-4 p-4 bg-muted/50 h-full"
        >
          <span class="text-lg font-semibold">
            {{ page.features.cta.title }}
          </span>
          <div>
            <UButton :to="page.features.cta.to" :label="page.features.cta.label" trailing :icon="page.features.cta.icon" />
          </div>
        </Motion>
      </template>
    </UPageSection>

    <UPageSection
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default'
      }"
    >
      <template #title>
        <LazyMDC :value="page.foundation.title" unwrap="p" cache-key="index-foundation-title" hydrate-never />
      </template>
      <template #description>
        <LazyMDC :value="page.foundation.description" unwrap="p" cache-key="index-foundation-description" hydrate-never />
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-3">
        <template v-for="(group, groupIndex) in groupedFoundationItems" :key="groupIndex">
          <UPageCard
            v-if="group.id !== 'bundler'"
            :title="group.item.title"
            :description="group.item.description"
            class="h-full"
            :ui="{
              root: `${group.classes} ring-0 border border-default ${groupIndex === 0 ? 'sm:border-r-0 max-sm:border-b-0' : groupIndex === groupedFoundationItems.length - 1 ? 'sm:border-l-0 max-sm:border-t-0' : 'max-sm:border-y-0'}`,
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
            class="h-full ring-0 border border-default"
            :ui="{
              root: `${group.classes} ${group.items[activeBundlerIndex].gradient}`,
              title: 'text-lg font-semibold'
            }"
          >
            <template #leading>
              <div class="flex items-center space-x-2">
                <div
                  v-for="(bundler, bIndex) in group.items"
                  :key="bIndex"
                  class="size-7 justify-center inline-flex items-end"
                >
                  <UIcon
                    :name="bundler.logo"
                    class="cursor-pointer transition-all duration-150 ease-in-out"
                    :class="bIndex === activeBundlerIndex
                      ? 'size-7 opacity-100'
                      : 'size-6 opacity-50 grayscale hover:size-7'"
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
      :ui="{
        container: 'sm:py-12 lg:py-12 sm:gap-8',
        description: 'text-base! text-balance before:content-[open-quote] before:text-5xl before:mr-1 before:leading-0 before:inline-block before:transform before:translate-y-4 before:align-baseline before:text-dimmed after:content-[close-quote] after:text-5xl after:leading-0 after:ml-1 after:inline-block after:transform after:translate-y-7 after:align-baseline after:text-dimmed'
      }"
    >
      <UUser
        v-bind="page.testimonial.author"
        size="xl"
        class="justify-center"
      />
    </UPageCTA>
    <UPageSection
      :title="page.stats.title"
      :description="page.stats.description"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default'
      }"
    >
      <div class="flex flex-col md:flex-row gap-4">
        <div class="md:w-1/4 flex flex-col gap-4">
          <UPageCard class="flex-1" variant="subtle" to="https://npm.chart.dev/nuxt">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-default p-2 flex items-center justify-center border border-default">
                <UIcon name="i-simple-icons-npm" class="text-red-500 size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-lg text-highlighted">
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
              <div class="rounded-lg bg-default p-2 flex items-center justify-center border border-default">
                <UIcon name="i-simple-icons-github" class="size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-semibold text-lg text-highlighted">
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
              <p class="text-muted text-center">
                {{ page.stats.community.description }}
              </p>
              <UButton class="mt-4 w-fit" v-bind="page.stats.cta" />
            </div>
          </UPageCard>
        </div>

        <div class="md:w-1/4 flex flex-col gap-4">
          <UPageCard class="flex-1" variant="subtle" to="https://go.nuxt.com/x">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-default p-2 flex items-center justify-center border border-default">
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
              <div class="rounded-lg bg-default p-2 flex items-center justify-center border border-default">
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
      :description="page.modules.description"
      :links="page.modules.links"
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default',
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    >
      <template #title>
        <LazyMDC :value="page.modules.title" unwrap="p" cache-key="index-modules-title" hydrate-never />
      </template>
      <UCarousel
        v-slot="{ item }"
        dots
        wheel-gestures
        arrows
        :items="officialModules"
        class="min-w-0"
        :ui="{
          container: 'ms-0 items-stretch',
          item: 'min-w-0 shrink-0 sm:basis-1/3 p-2',
          arrows: 'hidden 2xl:block'
        }"
      >
        <ModuleItem :module="item" :show-badge="false" :is-added="false" :show-add-button="false" class="min-h-full" />
      </UCarousel>
    </UPageSection>

    <UPageSection
      :title="page.deploy.title"
      :description="page.deploy.description"
      :links="page.deploy.links"
      orientation="horizontal"
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default'
      }"
    >
      <NuxtImg
        src="/assets/landing/deploy.svg"
        width="512"
        height="439"
        :alt="page.deploy.title"
        class="mx-auto max-w-lg sm:w-full w-full"
        loading="lazy"
      />
    </UPageSection>

    <UPageSection
      :title="page.support.title"
      :description="page.support.description"
      :links="page.support.links"
      orientation="horizontal"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-20% to-default',
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    >
      <template #title>
        <LazyMDC :value="page.support.title" unwrap="p" cache-key="index-support-title" hydrate-never />
      </template>
      <template #description>
        <LazyMDC :value="page.support.description" unwrap="p" cache-key="index-support-description" hydrate-never />

        <UPageLogos :ui="{ logos: 'mt-6' }" marquee>
          <NuxtImg
            v-for="company in page.support.companies"
            :key="company.alt"
            v-bind="company"
            loading="lazy"
            class="h-8 max-w-[70px] object-contain filter invert dark:invert-0 opacity-50"
            :alt="`${company.alt} logo`"
          />
        </UPageLogos>
      </template>

      <UPageCard variant="subtle" :ui="{ container: 'gap-y-8 sm:p-8' }">
        <UPageFeature
          v-for="(feature, index) in page.support.features"
          :key="index"
          v-bind="feature"
          :ui="{
            root: 'lg:items-center lg:gap-3',
            leadingIcon: 'text-highlighted',
            leading: 'bg-default p-1 lg:p-2.5 rounded-sm border border-default',
            description: 'mt-0'
          }"
        />
      </UPageCard>
    </UPageSection>
    <UPageSection
      :title="page.contributors.title"
      :description="page.contributors.description"
      :links="page.contributors.links"
      orientation="horizontal"
      reverse
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default'
      }"
    >
      <HomeSectionContributors />
    </UPageSection>

    <UPageSection
      id="showcase"
      headline="Showcase"
      title="Real-world Web Applications built with Nuxt"
      :links="[{
        label: 'View all websites',
        to: '/showcase',
        color: 'neutral',
        size: 'md'
      }]"
      class="overflow-hidden border-x border-t border-default"
      :ui="{
        title: 'max-w-2xl mx-auto',
        container: 'relative'
      }"
    >
      <div aria-hidden="true" class="block absolute z-[-1] border-x border-default inset-0 mx-4 sm:mx-6 lg:mx-8" />
      <UCarousel
        v-slot="{ item }"
        loop
        dots
        wheel-gestures
        arrows
        :autoplay="{ delay: 3000 }"
        :items="showcase.websites.slice(0, 10)"
        class="min-w-0"
        :ui="{
          item: 'basis-full sm:basis-1/2',
          container: 'py-2',
          arrows: 'hidden 2xl:block'
        }"
      >
        <UPageCard
          :to="item.url"
          target="_blank"
          variant="subtle"
          class="group rounded-none sm:rounded-lg"
          :ui="{
            container: 'p-2 sm:p-4',
            title: 'flex items-center gap-1'
          }"
        >
          <template #title>
            <span>
              {{ item.name }}
            </span>
            <UIcon name="i-lucide-arrow-up-right" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out text-primary" />
          </template>
          <NuxtImg
            :src="getWebsiteScreenShotUrl(item)"
            :alt="item.name"
            class="rounded-none sm:rounded-lg w-full border border-default aspect-video"
            loading="lazy"
          />
        </UPageCard>
      </UCarousel>
    </UPageSection>

    <UPageSection
      :title="page.sponsors.title"
      :description="page.sponsors.description"
      :links="page.sponsors.links"
      class="relative"
      :ui="{
        root: 'bg-gradient-to-b border-t border-default from-muted dark:from-muted/40 to-default',
        container: 'py-12 sm:py-16 lg:py-20'
      }"
    >
      <div class="flex flex-col items-center">
        <template v-for="({ tier, sponsors }) of sponsorGroups" :key="tier">
          <div class="w-full mb-24">
            <UBadge color="neutral" variant="subtle" class="capitalize mb-2">
              {{ tier }} sponsors
            </UBadge>

            <div class="w-full border border-default rounded-lg">
              <table class="w-full">
                <tbody>
                  <template v-for="(_, rowIndex) in Math.ceil(sponsors.length / 3)" :key="rowIndex">
                    <tr>
                      <template v-for="colIndex in 3" :key="colIndex">
                        <td
                          v-if="(rowIndex * 3) + colIndex - 1 < sponsors.length"
                          class="border-b border-r border-default p-0 w-1/3 h-[120px]"
                          :class="{
                            'border-r-0': colIndex === 3,
                            'border-b-0': rowIndex === Math.ceil(sponsors.length / 3) - 1
                          }"
                        >
                          <NuxtLink
                            :to="sponsors[(rowIndex * 3) + colIndex - 1].sponsorUrl"
                            target="_blank"
                            class="flex items-center gap-2 justify-center h-full hover:bg-muted/50 transition-colors"
                          >
                            <NuxtImg
                              :src="sponsors[(rowIndex * 3) + colIndex - 1].sponsorLogo"
                              :alt="`${sponsors[(rowIndex * 3) + colIndex - 1].sponsorName} logo`"
                              loading="lazy"
                              class="h-10 max-w-[140px] object-contain rounded-lg"
                              height="40"
                              width="40"
                            />
                            <span class="text-base hidden sm:block font-semibold">{{ sponsors[(rowIndex * 3) + colIndex - 1].sponsorName }}</span>
                          </NuxtLink>
                        </td>
                        <td
                          v-else
                          class="border-b border-r border-default p-0 w-1/3 h-[120px]"
                          :class="{
                            'border-r-0': colIndex === 3,
                            'border-b-0': rowIndex === Math.ceil(sponsors.length / 3) - 1
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
      </div>
    </UPageSection>
  </div>
</template>
