<script setup lang="ts">
import { kebabCase } from 'scule'
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageBreadcrumb } from '@nuxt/content/utils'
import { mapContentNavigation } from '@nuxt/ui/utils/content'

definePageMeta({
  heroBackground: 'opacity-30',
  key: 'docs'
})

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))

const route = useRoute()
const nuxtApp = useNuxtApp()
const { version } = useDocsVersion()

const path = computed(() => route.path.replace(/\/$/, ''))

const asideNavigation = computed(() => {
  const path = [version.value.path, route.params.slug?.[version.value.path.split('/').length - 2]].filter(Boolean).join('/')

  return navPageFromPath(path, navigation.value)?.children || []
})

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
  useAsyncData(kebabCase(path.value), () => paintResponse().then(() => nuxtApp.static[kebabCase(path.value)] ?? queryCollection(version.value.collection).path(path.value).first()), {
    watch: [path]
  }),
  useAsyncData(`${kebabCase(path.value)}-surround`, () => paintResponse().then(() => nuxtApp.static[`${kebabCase(path.value)}-surround`] ?? queryCollectionItemSurroundings(version.value.collection, path.value, {
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
  const links = mapContentNavigation(findPageBreadcrumb(navigation.value, path.value)).map(link => ({
    label: link.label,
    to: link.to
  }))

  if (path.value.startsWith(`${version.value.path}/bridge`) || path.value.startsWith(`${version.value.path}/migration`)) {
    links.splice(1, 0, {
      label: 'Upgrade Guide',
      to: `${version.value.path}/getting-started/upgrade`
    })
  }

  return links
})

const editLink = computed(() => `https://github.com/nuxt/nuxt/edit/${version.value.branch}/${page?.value?.stem?.replace(/docs\/\d\.x/, 'docs')}.${page?.value?.extension}`)

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

const title = computed(() => page.value?.seo?.title || page.value?.title)
const titleTemplate = computed(() => `${findTitleTemplate(page, navigation)} ${version.value.shortTag}`)

useSeoMeta({
  titleTemplate,
  title
})

if (import.meta.server) {
  const description = page.value?.seo?.description || page.value?.description
  useSeoMeta({
    description,
    ogDescription: description,
    ogTitle: titleTemplate.value?.includes('%s') ? titleTemplate.value.replace('%s', title.value) : title.value
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
        <UPageHeader v-bind="page">
          <template #headline>
            <UBreadcrumb :items="breadcrumb" />
          </template>

          <template #links>
            <UButton
              v-for="link in page.links?.map(link => ({ ...link, size: 'md' }))"
              :key="link.label"
              color="neutral"
              variant="outline"
              :target="link.to.startsWith('http') ? '_blank' : undefined"
              v-bind="link"
            >
              <template v-if="link.avatar" #leading>
                <UAvatar v-bind="link.avatar" size="2xs" :alt="`${link.label} avatar`" />
              </template>
            </UButton>
            <PageHeaderLinks :key="page.path" />
          </template>
        </UPageHeader>

        <UPageBody>
          <ContentRenderer v-if="page.body" :value="page" />
          <div>
            <Feedback :page="page" />
            <USeparator class="mt-6 mb-10">
              <div class="flex items-center gap-2 text-sm text-muted">
                <UButton
                  size="sm"
                  variant="link"
                  color="neutral"
                  to="https://github.com/nuxt/nuxt/issues/new/choose"
                  target="_blank"
                  label="Report an issue"
                />
                or
                <UButton
                  size="sm"
                  variant="link"
                  color="neutral"
                  :to="editLink"
                  target="_blank"
                  label="Edit this page on GitHub"
                />
              </div>
            </USeparator>
            <UContentSurround :surround="surround" />
          </div>
        </UPageBody>

        <template #right>
          <ContentToc
            :links="page.body?.toc?.links"
            :community-links="communityLinks"
            highlight
            class="hidden lg:block lg:backdrop-blur-none"
          />
          <div class="order-first lg:order-last sticky top-(--ui-header-height) z-10 bg-default/75 lg:bg-[initial] backdrop-blur -mx-4 p-6 border-b border-dashed border-default flex justify-between">
            <UDrawer
              direction="left"
              title="Navigation"
              inset
              :handle="false"
              side="left"
              class="lg:hidden"
              :ui="{
                content: 'w-full max-w-2/3'
              }"
            >
              <UButton
                label="Menu"
                icon="i-lucide-text-align-start"
                color="neutral"
                variant="link"
                size="xs"
                aria-label="Open navigation"
                class="-m-4"
              />
              <template #body>
                <UContentNavigation
                  :navigation="asideNavigation"
                  default-open
                  trailing-icon="i-lucide-chevron-right"
                  :ui="{ linkTrailingIcon: 'group-data-[state=open]:rotate-90' }"
                  highlight
                />
              </template>
            </UDrawer>
            <UDrawer
              direction="right"
              :handle="false"
              side="right"
              inset
              class="lg:hidden"
              :ui="{
                content: 'w-full max-w-2/3'
              }"
            >
              <UButton
                label="On this page"
                icon="i-lucide-book-open"
                color="neutral"
                variant="link"
                size="xs"
                aria-label="Open on this page"
                class="-m-4"
              />
              <template #body>
                <ContentToc
                  :links="page.body?.toc?.links"
                  :community-links="communityLinks"
                  :open="true"
                  default-open
                  :ui="{
                    root: 'top-0',
                    trailingIcon: 'hidden',
                    bottom: 'flex flex-col'
                  }"
                />
              </template>
            </UDrawer>
          </div>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
