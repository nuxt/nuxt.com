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

const { fetchList, modules } = useModules()

await fetchList()

const officialModules = computed(() => {
  return modules.value
    .filter(module => module.type === 'official')
    .sort((a, b) => b.stats.downloads - a.stats.downloads)
})

const { data: sponsors } = await useFetch('https://api.nuxt.com/sponsors')
console.log(sponsors)

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
</script>

<template>
  <div v-if="page">
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
      <UPageCard v-else class="bg-(--ui-primary) max-w-lg size-full">
        <template #title>
          <UTabs
            :items="tabs"
            :ui="{
              list: 'px-0 bg-transparent max-w-lg overflow-x-auto',
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
      <UPageLogos :title="page?.logos.title" :ui="{ title: 'text-left text-(--ui-text-muted)' }">
        <NuxtImg
          v-for="company in page?.logos.companies"
          :key="company.alt"
          v-bind="company"
          class="h-6 shrink-0 max-w-[140px] filter dark:invert invert-0 opacity-50"
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

    <UPageSection class="relative">
      <svg class="absolute top-0 inset-x-0 pointer-events-none opacity-30 dark:opacity-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1017 181"><g opacity=".5"><mask id="c" fill="#fff"><path d="M0 0h1017v181H0V0Z" /></mask><path fill="url(#a)" fill-opacity=".5" d="M0 0h1017v181H0V0Z" /><path fill="url(#b)" d="M0 2h1017v-4H0v4Z" mask="url(#c)" /></g><defs><radialGradient
        id="a"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="rotate(90.177 244.7795736 263.4645037) scale(161.501 509.002)"
        gradientUnits="userSpaceOnUse"
      ><stop stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></radialGradient><linearGradient
        id="b"
        x1="10.9784"
        x2="1017"
        y1="91"
        y2="90.502"
        gradientUnits="userSpaceOnUse"
      ><stop stop-color="#334155" stop-opacity="0" /><stop offset=".395" stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></linearGradient></defs></svg>
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

          <div v-else class="h-full">
            <UPageCard
              :title="group.items[activeBundlerIndex].title"
              :description="group.items[activeBundlerIndex].description"
              class="h-full"
              :ui="{
                root: group.classes + ' ' + group.items[activeBundlerIndex].gradient,
                title: 'text-lg font-semibold'
              }"
            >
              <template #leading>
                <div class="flex items-center space-x-3">
                  <UIcon
                    v-for="(bundler, bIndex) in group.items"
                    :key="bIndex"
                    :name="bundler.logo"
                    class="cursor-pointer transition-all duration-300 ease-in-out"
                    :class="bIndex === activeBundlerIndex
                      ? 'size-7 opacity-100'
                      : 'size-5 opacity-50 grayscale'"
                    @click="activeBundlerIndex = bIndex"
                  />
                </div>
              </template>
              <ULink
                :to="group.items[activeBundlerIndex].link.to"
                :style="{ color: group.items[activeBundlerIndex].color }"
              >
                {{ group.items[activeBundlerIndex].link.label }}
              </ULink>
            </UPageCard>
          </div>
        </template>
      </div>
    </UPageSection>

    <UPageSection
      :description="page.modules.description.replace('%s', officialModules.length.toString())"
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
        loop
        dots
        wheel-gestures
        :autoplay="{ delay: 3000 }"
        :items="officialModules"
        class="bg-(--ui-primary) p-4 min-w-0 rounded-lg"
        :ui="{
          item: 'max-w-sm'
        }"
      >
        <ModuleItem :module="item" />
      </UCarousel>
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
      :title="page.deploy.title"
      :description="page.deploy.description"
      :links="page.deploy.links"
      orientation="horizontal"
      :ui="{
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
        title: 'sm:text-3xl lg:text-4xl font-semibold'
      }"
    >
      <div class="text-(--ui-primary) absolute top-0 inset-x-0 pointer-events-none opacity-30 dark:opacity-60">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1017 181">
          <g opacity=".5">
            <mask id="mask" fill="white">
              <path d="M0 0h1017v181H0V0Z" />
            </mask>
            <path fill="url(#gradient1)" fill-opacity=".5" d="M0 0h1017v181H0V0Z" />
            <path fill="url(#gradient2)" d="M0 2h1017v-4H0v4Z" mask="url(#mask)" />
          </g>
          <defs>
            <radialGradient
              id="gradient1"
              cx="0"
              cy="0"
              r="1"
              gradientTransform="rotate(90.177 244.7795736 263.4645037) scale(161.501 509.002)"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="currentColor" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0" />
            </radialGradient>
            <linearGradient
              id="gradient2"
              x1="10.9784"
              x2="1017"
              y1="91"
              y2="90.502"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="currentColor" stop-opacity="0" />
              <stop offset=".395" stop-color="currentColor" />
              <stop offset="1" stop-color="currentColor" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="md:w-1/4 flex flex-col gap-4">
          <UPageCard class="flex-1 bg-gradient-to-r from-(--ui-bg-inverted)/10 to-(--ui-bg)">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-npm" class="text-red-500 size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium">
                  {{ (stats.monthlyDownloads / 1000000).toFixed(1) }}M
                </span>
                <p>Monthly downloads</p>
              </div>
            </div>
          </UPageCard>

          <UPageCard class="flex-1 bg-gradient-to-r from-(--ui-bg-inverted)/10 to-(--ui-bg)">
            <div class="flex items-center gap-2">
              <div class="rounded-lg bg-(--ui-bg) p-2 flex items-center justify-center border border-(--ui-border)">
                <UIcon name="i-simple-icons-github" class="size-6" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium">
                  {{ (stats.stars / 1000).toFixed(1) }}k
                </span>
                <p>Stars</p>
              </div>
            </div>
          </UPageCard>
        </div>

        <div class="md:w-1/2">
          <UPageCard class="h-full bg-gradient-to-b from-(--ui-bg-inverted)/10 to-(--ui-bg)">
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
          <UPageCard class="flex-1 bg-gradient-to-r from-(--ui-bg-inverted)/10 to-(--ui-bg)">
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

          <UPageCard class="flex-1 bg-gradient-to-r from-(--ui-bg-inverted)/10 to-(--ui-bg)">
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
        title: 'text-left sm:text-3xl lg:text-4xl font-semibold',
        description: 'text-left',
        container: 'py-12 sm:py-16 lg:py-20',
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
        container: 'py-12 sm:py-16 lg:py-20',
        title: 'sm:text-3xl lg:text-4xl font-semibold'
      }"
    >
      <svg class="absolute top-0 inset-x-0 pointer-events-none opacity-30 dark:opacity-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1017 181"><g opacity=".5"><mask id="c" fill="#fff"><path d="M0 0h1017v181H0V0Z" /></mask><path fill="url(#a)" fill-opacity=".5" d="M0 0h1017v181H0V0Z" /><path fill="url(#b)" d="M0 2h1017v-4H0v4Z" mask="url(#c)" /></g><defs><radialGradient
        id="a"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="rotate(90.177 244.7795736 263.4645037) scale(161.501 509.002)"
        gradientUnits="userSpaceOnUse"
      ><stop stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></radialGradient><linearGradient
        id="b"
        x1="10.9784"
        x2="1017"
        y1="91"
        y2="90.502"
        gradientUnits="userSpaceOnUse"
      ><stop stop-color="#334155" stop-opacity="0" /><stop offset=".395" stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></linearGradient></defs></svg>

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
                            class="flex items-center justify-center h-full hover:bg-(--ui-bg-muted)/50 transition-colors"
                          >
                            <NuxtImg
                              :src="value[(rowIndex * 3) + colIndex - 1].sponsorLogo"
                              :alt="value[(rowIndex * 3) + colIndex - 1].sponsorName"
                              class="h-10 max-w-[140px] object-contain"
                            />
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
