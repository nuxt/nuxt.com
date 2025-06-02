<script setup lang="ts">
import { kebabCase } from 'scule'
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageBreadcrumb, mapContentNavigation } from '#ui-pro/utils'

definePageMeta({
  layout: 'docs',
  heroBackground: 'opacity-30',
  key: 'docs'
})

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))

const route = useRoute()
const nuxtApp = useNuxtApp()
const { selectedVersion, versionItems } = useDocsVersion()

const path = computed(() => route.path.replace(/\/$/, ''))

const asideNavigation = computed(() => {
  const path = [selectedVersion.value.pathPrefix, route.params.slug?.[0]].filter(Boolean).join('/')

  return navPageFromPath(path, navigation.value)?.children || []
})

const { headerLinks } = useHeaderLinks()
const links = computed(() => headerLinks.value.find(link => link.to === '/docs')?.children ?? [])

function paintResponse() {
  if (import.meta.server) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 100)
    requestAnimationFrame(() => setTimeout(resolve, 0))
  })
}

const [{ data: page, status }, { data: surround }] = await Promise.all([
  useAsyncData(kebabCase(path.value), () => paintResponse().then(() => nuxtApp.static[kebabCase(path.value)] ?? queryCollection('docs').path(path.value).first()), {
    watch: [path]
  }),
  useAsyncData(`${kebabCase(path.value)}-surround`, () => paintResponse().then(() => nuxtApp.static[`${kebabCase(path.value)}-surround`] ?? queryCollectionItemSurroundings('docs', path.value, {
    fields: ['description']
  })), { watch: [path] })
])

watch(status, (status) => {
  if (status === 'pending') {
    nuxtApp.hooks.callHook('page:loading:start')
  } else if (status === 'success' || status === 'error') {
    nuxtApp.hooks.callHook('page:loading:end')
  }
})

watch(page, (page) => {
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }
}, { immediate: true })

const breadcrumb = computed(() => {
  const links = mapContentNavigation(findPageBreadcrumb(navigation.value, page.value)).map(link => ({
    label: link.label,
    to: link.to
  }))

  if (path.value.startsWith('/docs/bridge') || path.value.startsWith('/docs/migration')) {
    links.splice(1, 0, {
      label: 'Upgrade Guide',
      to: '/docs/getting-started/upgrade'
    })
  }

  return links
})

const titleTemplate = computed(() => findTitleTemplate(page, navigation))

const editLink = computed(() => `https://github.com/nuxt/nuxt/edit/main/docs/${page?.value?.stem?.split('/').slice(1).join('/')}.${page?.value?.extension}`)

const communityLinks = [{
  icon: 'i-lucide-heart',
  label: 'Become a Sponsor',
  to: 'https://go.nuxt.com/sponsor',
  target: '_blank'
}, {
  icon: 'i-lucide-chef-hat',
  label: 'Master Nuxt',
  to: 'https://masteringnuxt.com/nuxt3',
  target: '_blank'
}, {
  icon: 'i-lucide-award',
  label: 'Nuxt Certification',
  to: 'https://certification.nuxt.com',
  target: '_blank'
}]

const title = page.value.seo?.title || page.value.title

useSeoMeta({
  titleTemplate,
  title
})

if (import.meta.server) {
  const description = page.value.seo?.description || page.value.description
  useSeoMeta({
    description,
    ogDescription: description,
    ogTitle: titleTemplate.value?.includes('%s') ? titleTemplate.value.replace('%s', title) : title
  })

  defineOgImageComponent('Docs', {
    headline: breadcrumb.value.length ? breadcrumb.value.map(link => link.label).join(' > ') : '',
    title,
    description
  })
}
</script>

<template>
  <UContainer v-if="page">
    <UPage>
      <template #left>
        <UPageAside>
          <UDropdownMenu
            v-slot="{ open }"
            :modal="false"
            :items="versionItems"
            :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
            class="mb-4"
          >
            <UButton
              :label="selectedVersion.label"
              variant="subtle"
              trailing-icon="i-lucide-chevron-down"
              color="neutral"
              block
              size="md"
              :class="[open && 'bg-neutral/15 ']"
              :ui="{
                trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
              }"
            />
          </UDropdownMenu>
          <UPageAnchors :links="links" />
          <USeparator type="dashed" class="my-6" />
          <UContentNavigation
            :navigation="asideNavigation"
            default-open
            trailing-icon="i-lucide-chevron-right"
            :ui="{ linkTrailingIcon: 'group-data-[state=open]:rotate-90' }"
            highlight
          />
        </UPageAside>
      </template>
      <UPage>
        <UPageHeader v-bind="page" :links="page.links?.map(link => ({ ...link, size: 'md' }))">
          <template #headline>
            <UBreadcrumb :items="breadcrumb" />
          </template>
        </UPageHeader>

        <UPageBody>
          <ContentRenderer v-if="page.body" :value="page" />
          <div>
            <USeparator class="my-10">
              <div class="flex items-center gap-2 text-sm dark:text-gray-400">
                <UButton size="sm" variant="link" color="neutral" to="https://github.com/nuxt/nuxt/issues/new/choose" target="_blank">
                  Report an issue
                </UButton>
                or
                <UButton size="sm" variant="link" color="neutral" :to="editLink" target="_blank">
                  Edit this page on GitHub
                </UButton>
              </div>
            </USeparator>
            <UContentSurround :surround="surround" />
          </div>
        </UPageBody>

        <template v-if="page?.body?.toc?.links?.length" #right>
          <UContentToc :links="page.body?.toc?.links" highlight class="lg:backdrop-blur-none">
            <template #bottom>
              <div class="hidden lg:block space-y-6" :class="{ '!mt-6': page.body?.toc?.links?.length }">
                <USeparator v-if="page.body?.toc?.links?.length" type="dashed" />
                <UPageLinks title="Community" :links="communityLinks" />
                <USeparator type="dashed" />
                <SocialLinks />
                <Ads />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
