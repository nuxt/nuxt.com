<template>
  <div>
    <div class="flex items-center justify-center p-6 bg-gray-900 h-80 dark:bg-gray-800">
      <img v-if="page.logoFull" loading="lazy" :src="`${page.logoFull}`" :alt="page.title" class="h-20">
    </div>

    <AppContainer padded class="pb-16 sm:pb-32">
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
          <AppButton
            label="Visit website"
            :to="page.link"
            target="_blank"
            size="xl"
            variant="primary-gradient"
            custom-class="justify-center sm:justify-start"
            truncate
            @click="trackVisit(page.title)"
          />
        </div>
      </div>

      <div class="flex flex-col-reverse gap-16 xl:flex-row xl:justify-between">
        <div class="w-full xl:w-[70%]">
          <h2 class="text-3xl font-semibold u-text-gray-900">
            Discover the company
          </h2>
          <p class="mt-8 mb-8 leading-7 whitespace-pre-wrap u-text-gray-700">
            {{ page.fullDescription }}
          </p>

          <AppCard v-if="page.emailAddress" body-class="grid grid-cols-2 gap-8 p-10" rounded-class="rounded-xl" background-class="card-bg" @submit.prevent="contactAgency">
            <UFormGroup name="email" label="Your company" class="col-span-2 sm:col-span-1">
              <UInput
                v-model="form.company"
                label="Company"
                name="Company"
                placeholder="Your company"
                required
                size="xl"
                variant="outline"
                custom-class="flex-1"
              />
            </UFormGroup>

            <UFormGroup name="name" label="Your email" class="col-span-2 sm:col-span-1">
              <UInput
                v-model="form.email"
                label="Email"
                name="Email"
                placeholder="Your email"
                required
                size="xl"
                variant="outline"
                custom-class="flex-1"
                type="email"
              />
            </UFormGroup>

            <UFormGroup
              name="message"
              label="Your message"
              class="col-span-2"
            >
              <UTextarea
                v-model="form.message"
                label="Message"
                name="Message"
                placeholder="Message"
                required
                size="xl"
                variant="outline"
                custom-class="flex-1"
              />
            </UFormGroup>

            <div class="flex items-center justify-center col-span-2">
              <AppButton
                label="Contact us"
                type="submit"
                target="_blank"
                size="xl"
                variant="primary-gradient"
                custom-class="justify-center sm:justify-start"
                :disabled="loading"
              />
            </div>
          </AppCard>
          <div class="flex flex-col gap-8 mt-12 sm:flex-row">
            <AppButton
              label="Back to partners list"
              icon="uil:angle-left-b"
              to="/support/agencies"
              size="xl"
              variant="secondary"
              custom-class="justify-center sm:justify-start"
              @click="onBack"
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
              <div class="flex items-center gap-3 u-text-gray-700">
                <Icon name="uil:location-pin-alt" class="w-6 h-6 u-text-gray-900" />
                {{ page.location }}
              </div>
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
                    <span class="sr-only">{{ page.title }} {{link.key }}</span>
                    <Icon :name="link.icon" class="w-6 h-6 u-text-gray-900 transition duration-300 group-hover:u-text-gray-600" />
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppContainer>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { PropType, ComputedRef } from 'vue'
import type { AgencyPage } from '../../types'

const props = defineProps({
  page: {
    type: Object as PropType<AgencyPage>,
    required: true
  }
})

interface SocialLink {
  [key: string]: string,
  icon: string,
  url: string
}

const socialsMap = [
  {
    key: 'twitter',
    icon: 'uil:twitter',
    getUrl: (handle: string) => `https://twitter.com/${handle}`
  },
  {
    key: 'github',
    icon: 'uil:github',
    getUrl: (handle: string) => `https://github.com/${handle}`
  },
  {
    key: 'linkedin',
    icon: 'uil:linkedin',
    getUrl: (handle: string) => `https://www.linkedin.com/company/${handle}`
  },
  {
    key: 'facebook',
    icon: 'uil:facebook',
    getUrl: (handle: string) => `https://www.facebook.com/${handle}`
  }
]

const socialLinks: ComputedRef<SocialLink[]> = computed(() => {
  const socialLinks: Array<SocialLink> = []

  socialsMap.forEach(({ key, icon, getUrl }) => {
    if (props.page[key]) {
      socialLinks.push({ key, icon, url: getUrl(props.page[key]) })
    }
  })
  return socialLinks
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

/* Contact form */

const initialForm = computed(() => ({
  company: '',
  email: '',
  agencyEmail: props?.page?.emailAddress,
  message: ''
}))

const form = reactive({ ...initialForm.value })
const loading = ref(false)

const { $toast } = useNuxtApp()

const contactAgency = () => {
  if (loading.value) { return }

  loading.value = true
  $fetch('/api/agencies', {
    method: 'POST',
    body: JSON.stringify(form)
  }).then((data: any) => {
    $toast.success({ title: 'Your message has been sent', description: data.response })
    Object.assign(form, initialForm.value)
  }).catch(() => {
    $toast.error({ title: 'An error occured', description: 'Your message could not be sent, please contact us directly at contact@nuxtlabs.com' })
  }).finally(() => {
    loading.value = false
  })
}
</script>

<style scoped lang="postcss">
button[type="submit"]{
 @apply border-gradient-br-gradient-black;
}
</style>
