<template>
  <div>
    <div class="flex items-center justify-center p-6 bg-gray-900 h-80 dark:bg-gray-800">
      <img v-if="page.logoFull" loading="lazy" :src="`${page.logoFull}`" :alt="page.title" class="h-20">
    </div>

    <UContainer padded class="pb-16 sm:pb-32">
      <div class="flex gap-8 pb-8 -mt-6 sm:-mt-8 xl:pb-12">
        <div class="relative flex w-40 h-40 p-10 overflow-hidden border rounded-xl u-border-gray-200">
          <div class="absolute inset-0 logo-background" />
          <img v-if="page.logo.light" :src="page.logo.light" :alt="page.title" class="relative dark:hidden">
          <img v-if="page.logo.dark" :src="page.logo.dark" :alt="page.title" class="relative hidden dark:block">
          <img v-if="typeof page.logo === 'string'" :src="page.logo" :alt="page.title" class="relative">
        </div>
        <div class="flex items-center justify-between w-full pt-8">
          <div class="flex flex-col justify-end gap-1">
            <h1 class="text-3xl font-semibold u-text-black">
              {{ page.title }}
            </h1>
            <NuxtLink :to="page.link" target="_blank" rel="noopener" class="flex items-center gap-2 mt-1 font-medium u-text-gray-500">
              {{ websiteDomain }} <UIcon name="uil:external-link-alt" class="w-5 h-5" />
            </NuxtLink>
          </div>
          <div class="flex gap-4">
            <UButton
              label="Visit website"
              :to="page.link"
              target="_blank"
              size="xl"
              variant="transparent"
            />
            <UButton
              label="Contact partner"
              size="xl"
              variant="gray"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-8 xl:gap-12 xl:flex-row xl:justify-between">
        <div class="w-full xl:w-[70%]">
          <h2 class="text-3xl font-semibold u-text-gray-900">
            Discover the company
          </h2>
          <p class="mt-8 leading-7 u-text-gray-700">
            <span style="white-space: pre-wrap">{{ page.fullDescription }}</span>
          </p>
          <div class="flex gap-8 mt-12">
            <UButton
              label="Back to partners list"
              icon="uil:angle-left"
              to="/community/partners"
              size="xl"
              variant="secondary"
              @click="onBack"
            />
            <UButton
              label="Become a partner"
              to="/company/partners"
              size="xl"
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
                  <UIcon name="heroicons-solid:check-circle" class="w-6 h-6 u-text-gray-900" />
                  {{ service }}
                </li>
              </ul>
            </div>
            <div v-if="page.location">
              <h2 class="mb-4 text-2xl font-semibold u-text-gray-900">
                Location
              </h2>
              <span class="flex items-center gap-3 u-text-gray-700">
                <UIcon name="uil:location-pin-alt" class="w-6 h-6 u-text-gray-900" />
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
                    class="flex items-center gap-3 u-text-gray-700"
                  >
                    <UIcon name="uil:external-link-alt" class="w-6 h-6 u-text-gray-900" />
                    {{ link.name }}
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

const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

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

const onBack = (e) => {
  const lastUrl = router.options.history.state.back as String | null
  if (lastUrl?.startsWith('/community/partners')) {
    e.preventDefault()
    router.push(lastUrl as RouteLocationRaw)
  }
}
</script>

<style scoped>
.logo-background {
  backdrop-filter: blur(89px);
  background: rgba(255, 255, 255, 0.6);
}
.logo-background.dark {
  background: rgba(30, 30, 33, 0.7);
}
</style>
