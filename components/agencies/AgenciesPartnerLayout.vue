<template>
  <div>
    <div class="flex items-center justify-center p-6 bg-gray-900 h-80 dark:bg-gray-800">
      <img v-if="page.logoFull" loading="lazy" :src="`${page.logoFull}`" :alt="page.title" class="h-20">
    </div>

    <UContainer padded class="pb-16 sm:pb-32">
      <div
        class="flex flex-col justify-between gap-8 pb-8 -mt-8 sm:gap-4 sm:items-center sm:flex-row md:-mt-12 xl:pb-12"
      >
        <div class="flex gap-4 md:gap-8">
          <!-- `z-[1]` is a safari workaround -->
          <div
            class="relative z-[1] flex w-32 h-32 p-8 overflow-hidden border md:w-40 md:h-40 md:p-10 rounded-xl u-border-gray-200 flex-shrink-0"
          >
            <div class="absolute inset-0 bg-white/60 dark:bg-gray-900/70 backdrop-blur-lg" />
            <img v-if="page.logo?.light" :src="page.logo.light" :alt="page.title" class="relative dark:hidden">
            <img v-if="page.logo?.dark" :src="page.logo.dark" :alt="page.title" class="relative hidden dark:block">
            <img v-if="typeof page.logo === 'string'" :src="page.logo" :alt="page.title" class="relative">
          </div>
          <div class="flex flex-1 flex-col justify-center min-w-0 pt-8 md:pt-12">
            <h1 class="mb-2 text-3xl font-semibold u-text-black truncate">
              {{ page.title }}
            </h1>
            <NuxtLink
              :to="page.link"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 font-medium u-text-gray-500 hover:underline"
            >
              <span class="truncate">{{ websiteDomain }}</span>
              <Icon name="uil:external-link-alt" class="w-5 h-5 flex-shrink-0" />
            </NuxtLink>
          </div>
        </div>
        <div class="flex flex-row gap-2 sm:gap-4 md:pt-12">
          <UButton
            label="Visit website"
            :to="page.link"
            target="_blank"
            size="xl"
            variant="primary-gradient"
            custom-class="justify-center sm:justify-start"
            truncate
            @click="trackVisit(page.title)"
          />
          <!-- <UButton
            label="Contact partner"
            size="xl"
            variant="gray"
            custom-class="justify-center sm:justify-start"
            truncate
          /> -->
        </div>
      </div>

      <div class="flex flex-col-reverse gap-16 xl:flex-row xl:justify-between">
        <div class="w-full xl:w-[70%]">
          <h2 class="text-3xl font-semibold u-text-gray-900">
            Discover the company
          </h2>
          <p class="mt-8 leading-7 whitespace-pre-wrap u-text-gray-700">
            {{ page.fullDescription }}
          </p>
          <div class="flex flex-col gap-8 mt-12 sm:flex-row">
            <UButton
              label="Back to partners list"
              icon="uil:angle-left-b"
              to="/support/agencies"
              size="xl"
              variant="secondary"
              custom-class="justify-center sm:justify-start"
              @click="onBack"
            />
            <UButton
              label="Visit website"
              :to="page.link"
              target="_blank"
              size="xl"
              variant="primary-gradient"
              custom-class="justify-center sm:justify-start"
              truncate
              @click="trackVisit(page)"
            />
          </div>
        </div>

        <div class="w-full xl:w-[30%]">
          <div class="py-3 space-y-12 xl:py-0 xl:px-6">
            <div v-if="page.services && page.services.length" class="py-3">
              <h2 class="mb-4 text-2xl font-semibold u-text-gray-900">
                Services
              </h2>
              <ul class="flex flex-col gap-4">
                <li
                  v-for="(service, index) in page.services"
                  :key="index"
                  class="flex items-center gap-3 u-text-gray-700"
                >
                  <Icon name="uil:check-circle" class="w-6 h-6 u-text-gray-900" />
                  {{ service }}
                </li>
              </ul>
            </div>
            <div v-if="page.location">
              <h2 class="mb-4 text-2xl font-semibold u-text-gray-900">
                Location
              </h2>
              <span class="flex items-center gap-3 u-text-gray-700">
                <Icon name="uil:location-pin-alt" class="w-6 h-6 u-text-gray-900" />
                {{ page.location }}
              </span>
            </div>
            <div v-if="page.resources && page.resources.length">
              <h2 class="mb-4 text-2xl font-semibold u-text-gray-900">
                Resources
              </h2>
              <ul class="flex flex-col gap-4">
                <li v-for="(link, index) in page.resources" :key="index">
                  <NuxtLink
                    :to="link.url"
                    target="_blank"
                    rel="noopener"
                    class="flex items-center gap-3 u-text-gray-700 hover:underline"
                  >
                    <Icon name="uil:external-link-alt" class="w-6 h-6 u-text-gray-900" />
                    {{ link.name }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
            <div v-if="socialLinks && socialLinks.length">
              <h2 class="mb-4 text-2xl font-semibold u-text-gray-900">
                Social
              </h2>
              <ul class="flex flex-row gap-4">
                <li v-for="(link, index) in socialLinks" :key="index" class="group">
                  <NuxtLink
                    :to="link.url"
                    target="_blank"
                    rel="noopener"
                    class="flex items-center gap-3"
                  >
                    <Icon :name="link.icon" class="w-6 h-6 u-text-gray-900 transition duration-300 group-hover:u-text-gray-700" />
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { PropType, ComputedRef } from 'vue'
import type { AgencyPage } from '../../types'

interface socialLink {
  [key: string]: string,
  icon: string,
  url: string
}

const socialLinks: ComputedRef<socialLink>[] = computed(() => {
  const socialLinks: Array<any> = []
  const keys = ['twitter', 'github', 'linkedin', 'facebook']
  keys.forEach((social) => {
    if (props.page[social]) {
      socialLinks.push({ [social]: props.page[social], icon: `uil:${social}`, url: formatLink(social, props.page[social]) })
    }
  })
  return socialLinks
})

const formatLink = (social: string, partner: string) => {
  const socialLink = social === 'twitter'
    ? 'https://twitter.com/'
    : social === 'github'
      ? 'https://github.com/'
      : social === 'linkedin'
        ? 'https://www.linkedin.com/company/'
        : 'https://www.facebook.com/'

  return `${socialLink}${partner}`
}

const props = defineProps({
  page: {
    type: Object as PropType<AgencyPage>,
    required: true
  }
})

useTrackEvent('View Partner', { props: { partner: props.page.title } })

const trackVisit = (partner: any) => useTrackEvent('Visit Partner', { props: { partner } })

const websiteDomain = computed(() => {
  let domain

  if (props.page.link.includes('//')) {
    domain = props.page.link.split('/')[2]
  } else {
    domain = props.page.link.split('/')[0]
  }

  return domain
})

const router = useRouter()

const onBack = (e: { preventDefault: () => void }) => {
  const lastUrl = router.options.history.state.back as String | null
  if (lastUrl?.startsWith('/support/agencies')) {
    e.preventDefault()
    router.push(lastUrl as RouteLocationRaw)
  }
}
</script>
