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

const githubLink = computed(() => `https://github.com/nuxt/nuxt/edit/dev/docs/content/${page?.value?._file}`)
const breadcrumb = computed(() => mapContentNavigation(findPageBreadcrumb(navigation.value, page.value)))

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

            <div class="space-y-3">
              <NuxtLink :to="githubLink" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon name="i-ph-pen-duotone" class="w-5 h-5" />
                <span class="text-sm font-medium">Edit this page</span>
              </NuxtLink>

              <NuxtLink to="https://github.com/nuxt/nuxt" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon name="i-simple-icons-github" class="w-5 h-5" />
                <span class="text-sm font-medium">Star us on GitHub</span>
              </NuxtLink>

              <NuxtLink to="https://discord.com/invite/ps2h6QT" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon name="i-simple-icons-discord" class="w-5 h-5" />
                <span class="text-sm font-medium">Join us on Discord</span>
              </NuxtLink>

              <NuxtLink to="https://github.com/sponsors/nuxt" target="_blank" class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <UIcon name="i-ph-hand-heart-duotone" class="w-5 h-5" />
                <span class="text-sm font-medium">Become a Sponsor</span>
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
