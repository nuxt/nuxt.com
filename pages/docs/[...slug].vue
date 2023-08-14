<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const route = useRoute()
const { mapContentNavigation, findPageBreadcrumb } = useElementsHelpers()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/docs')
  .where({ _extension: 'md', navigation: { $ne: false } })
  .without(['body', 'excerpt'])
  .findSurround(route.path.endsWith('/') ? route.path.slice(0, -1) : route.path)
)

const breadcrumb = computed(() => mapContentNavigation(findPageBreadcrumb(navigation.value, page.value)))

const communityLinks = computed(() => [
  {
    icon: 'i-ph-pen-duotone',
    label: 'Edit this page',
    to: `https://github.com/nuxt/nuxt/edit/dev/docs/content/${page?.value?._file}`,
    target: '_blank'
  },
  {
    icon: 'i-ph-shooting-star-duotone',
    label: 'Star on GitHub',
    to: 'https://github.com/nuxt/nuxt',
    target: '_blank'
  },
  {
    icon: 'i-ph-chat-centered-text-duotone',
    label: 'Chat on Discord',
    to: 'https://discord.com/invite/ps2h6QT',
    target: '_blank'
  },
  {
    icon: 'i-ph-hand-heart-duotone',
    label: 'Become a Sponsor',
    to: 'https://github.com/sponsors/nuxt',
    target: '_blank'
  }
])

const ecosystemLinks = [
  {
    icon: 'i-ph-buildings-duotone',
    label: 'Enterprise Support',
    to: '/enterprise/support'
  },
  {
    icon: 'i-ph-handshake-duotone',
    label: 'Agency Partnership',
    to: '/enterprise/agencies'
  },
  {
    icon: 'i-ph-briefcase-duotone',
    label: 'Find a Nuxt Job',
    to: '/enterprise/jobs'
  },
  {
    icon: 'i-ph-graduation-cap-duotone',
    label: 'Mastering Nuxt 3',
    to: 'https://masteringnuxt.com/nuxt3?ref=nuxt',
    target: '_blank'
  }
]

useContentHead(page)
</script>

<template>
  <UPage>
    <UPageHeader v-bind="page">
      <template #headline>
        <span v-for="(link, index) in breadcrumb" :key="index" :class="[index < breadcrumb.length - 1 && 'text-gray-500 dark:text-gray-400']" class="flex items-center gap-1.5">
          {{ link.label }}

          <UIcon v-if="index < breadcrumb.length - 1" name="i-ph-caret-right" class="w-4 h-4" />
        </span>
      </template>
    </UPageHeader>

    <UPageBody prose>
      <ContentRenderer v-if="page && page.body" :value="page" />

      <hr v-if="surround?.length" class="border-gray-200 dark:border-gray-800 my-8">

      <UDocsSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UDocsToc :links="page.body?.toc?.links">
        <template #bottom>
          <div class="hidden lg:block">
            <hr v-if="page.body?.toc?.links?.length" class="border-gray-200 dark:border-gray-800 border-dashed my-6">
            <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
              Community
            </p>
            <div class="space-y-2">
              <NuxtLink v-for="link of communityLinks" :key="link.to" :to="link.to" :target="link.target" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon :name="link.icon" class="w-4 h-4" />
                <span class="text-sm font-medium">{{ link.label }}</span>
              </NuxtLink>
            </div>

            <hr class="border-gray-200 dark:border-gray-800 border-dashed my-6">
            <p class="text-sm/6 font-semibold flex items-center gap-1.5 mb-3">
              Ecosystem
            </p>
            <div class="space-y-2">
              <NuxtLink v-for="link of ecosystemLinks" :key="link.to" :to="link.to" :target="link.target" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon :name="link.icon" class="w-4 h-4" />
                <span class="text-sm font-medium">{{ link.label }}</span>
              </NuxtLink>
            </div>

            <hr class="border-gray-200 dark:border-gray-800 border-dashed my-6">

            <Ads />
          </div>
        </template>
      </UDocsToc>
    </template>
  </UPage>
</template>
