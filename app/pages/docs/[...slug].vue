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
const menuDrawerOpen = ref(false)
const onThisPageDrawerOpen = ref(false)

const route = useRoute()
const nuxtApp = useNuxtApp()
const { version } = useDocsVersion()
const { headerLinks } = useHeaderLinks()

const path = computed(() => route.path.replace(/\/$/, ''))

const ignoredPaths = ['.nuxt', '.output', '.env', 'node_modules']
const navClass = (item: ContentNavigationItem) => {
  if (ignoredPaths.includes(item.title) && !route.path.includes(item.path)) {
    return 'opacity-70 hover:opacity-100'
  }
  return ''
}

const asideNavigation = computed(() => {
  const path = [version.value.path, route.params.slug?.[version.value.path.split('/').length - 2]].filter(Boolean).join('/')

  const nav = navPageFromPath(path, navigation.value)?.children || []

  return nav.map(item => ({
    ...item,
    class: navClass(item)
  }))
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

watch(route, () => {
  menuDrawerOpen.value = false
  onThisPageDrawerOpen.value = false
})

watch(page, (page) => {
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }
}, { immediate: true })

// Get the -2 item of the breadcrumb
const currentSectionTitle = computed(() => headerLinks.value[0].children.find(link => path.value.includes(link.to))?.label || findPageBreadcrumb(navigation.value, path.value).slice(-1)[0].title)

const breadcrumb = computed(() => {
  const links = mapContentNavigation(findPageBreadcrumb(navigation.value, path.value)).map(link => ({
    label: link.label,
    to: link.to
  })).slice(1)

  if (path.value.startsWith(`${version.value.path}/bridge`) || path.value.startsWith(`${version.value.path}/migration`)) {
    links.unshift({
      label: 'Upgrade Guide',
      to: `${version.value.path}/getting-started/upgrade`
    })
  }
  if (!links.length) {
    links.push({
      label: currentSectionTitle.value,
      to: path.value
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

useHead({
  link: [
    {
      rel: 'alternate',
      href: `https://nuxt.com/raw${path.value}.md`,
      type: 'text/markdown'
    }
  ]
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

function refreshHeading(opened: boolean) {
  if (!opened) return
  nextTick(() => nuxtApp.callHook('page:loading:end'))
}
</script>

<template>
  <UContainer v-if="page">
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            :navigation="asideNavigation"
            :collapsible="false"
            highlight
          />
        </UPageAside>
      </template>
      <UPage>
        <UPageHeader
          :ui="{
            wrapper: 'flex-row items-center flex-wrap justify-between'
          }"
          v-bind="page"
        >
          <template #headline>
            <UBreadcrumb :items="breadcrumb" />
          </template>

          <template #links>
            <UButton
              v-for="link in page.links?.map(link => ({ ...link, size: 'md' }))"
              :key="link.label"
              color="neutral"
              variant="soft"
              :target="link.to.startsWith('http') ? '_blank' : undefined"
              v-bind="{ ...link, size: 'sm' }"
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
              v-model:open="menuDrawerOpen"
              direction="left"
              :title="currentSectionTitle"
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
              v-model:open="onThisPageDrawerOpen"
              direction="right"
              :handle="false"
              side="right"
              inset
              class="lg:hidden"
              no-body-styles
              :ui="{
                content: 'w-full max-w-2/3'
              }"
              @update:open="refreshHeading"
            >
              <UButton
                label="On this page"
                trailing-icon="i-lucide-chevron-right"
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
                    root: '!mx-0 !px-1 top-0 overflow-visible',
                    container: '!pt-0 border-b-0',
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
