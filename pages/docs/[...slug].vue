<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'
import type { ParsedContent, NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

const route = useRoute()
const { navKeyFromPath } = useContentHelpers()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  if (page.value.surround === false) {
    return []
  }
  return queryContent('/docs')
    .where({ _extension: 'md', navigation: { $ne: false } })
    .without(['body', 'excerpt'])
    .findSurround(withoutTrailingSlash(route.path))
})

const breadcrumb = computed(() => {
  const links = mapContentNavigation(findPageBreadcrumb(navigation.value, page.value))
  if (route.path.startsWith('/docs/bridge') || route.path.startsWith('/docs/migration')) {
    links.splice(1, 0, {
      label: 'Upgrade Guide',
      to: '/docs/getting-started/upgrade'
    })
  }

  return links
})
const titleTemplate = computed(() => {
  if (page.value.titleTemplate) return page.value.titleTemplate
  const titleTemplate = navKeyFromPath(route.path, 'titleTemplate', navigation.value)
  if (titleTemplate) return titleTemplate
  return '%s · Nuxt'
})

const communityLinks = computed(() => [{
  icon: 'i-ph-pen-duotone',
  label: 'Edit this page',
  to: `https://github.com/nuxt/nuxt/edit/dev/docs/content/${page?.value?._file}`,
  target: '_blank'
}, {
  icon: 'i-ph-shooting-star-duotone',
  label: 'Star on GitHub',
  to: 'https://github.com/nuxt/nuxt',
  target: '_blank'
}, {
  icon: 'i-ph-chat-centered-text-duotone',
  label: 'Chat on Discord',
  to: 'https://discord.com/invite/ps2h6QT',
  target: '_blank'
}, {
  icon: 'i-ph-hand-heart-duotone',
  label: 'Become a Sponsor',
  to: 'https://github.com/sponsors/nuxt',
  target: '_blank'
}])

const ecosystemLinks = [{
  icon: 'i-ph-buildings-duotone',
  label: 'Enterprise Support',
  to: '/enterprise/support'
}, {
  icon: 'i-ph-handshake-duotone',
  label: 'Nuxt Agencies',
  to: '/enterprise/agencies'
}, {
  icon: 'i-ph-briefcase-duotone',
  label: 'Find a Nuxt Job',
  to: '/enterprise/jobs'
}, {
  icon: 'i-ph-graduation-cap-duotone',
  label: 'Video Courses',
  to: 'https://masteringnuxt.com/nuxt3?ref=nuxt',
  target: '_blank'
}]

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate,
  title,
  description,
  ogDescription: description,
  ogTitle: titleTemplate.value?.includes('%s') ? titleTemplate.value.replace('%s', title) : title
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: breadcrumb.value.length ? breadcrumb.value[breadcrumb.value.length - 1].label : ''
})
</script>

<template>
  <UPage>
    <UPageHeader v-bind="page">
      <template #headline>
        <NuxtLink v-for="(link, index) in breadcrumb" :key="index" :to="link.to" :class="[index < breadcrumb.length - 1 && 'text-gray-500 dark:text-gray-400']" class="flex items-center gap-1.5 group">
          <span :class="[index < breadcrumb.length - 1 && 'group-hover:text-gray-700 dark:group-hover:text-gray-200']">{{ link.label }}</span>

          <UIcon v-if="index < breadcrumb.length - 1" name="i-ph-caret-right" class="w-4 h-4" />
        </NuxtLink>
      </template>
    </UPageHeader>

    <UPageBody prose>
      <ContentRenderer v-if="page && page.body" :value="page" />

      <hr v-if="surround?.length">

      <UDocsSurround :surround="(surround as ParsedContent[])" />
    </UPageBody>

    <template v-if="page.toc !== false && page.body?.toc?.links?.length" #right>
      <UDocsToc :links="page.body?.toc?.links">
        <template #bottom>
          <div class="hidden lg:block space-y-6" :class="{ '!mt-6': page.body?.toc?.links?.length }">
            <UDivider v-if="page.body?.toc?.links?.length" type="dashed" />

            <UPageLinks title="Community" :links="communityLinks" />

            <UDivider type="dashed" />

            <UPageLinks title="Ecosystem" :links="ecosystemLinks" />

            <UDivider type="dashed" />

            <Ads />
          </div>
        </template>
      </UDocsToc>
    </template>
  </UPage>
</template>
