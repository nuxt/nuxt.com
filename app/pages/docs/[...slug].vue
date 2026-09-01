<script setup lang="ts">
import { kebabCase } from 'scule'
import type { NavigationItem } from 'comark-content'
import { DocsProseImg } from '#components'
import { CLI_DOCS_REFS, CLI_DOCS_REPO, cliDocsPathPrefix } from '#shared/utils/cli'
import { cliInstanceKey } from '#shared/utils/content'
import { DOCS_REFS, DOCS_REPO, SUPPORTED_DOCS_PATH_REGEX, isVersionedDocsPath } from '#shared/utils/docs'

definePageMeta({
  heroBackground: 'opacity-30',
  key: 'docs'
})

const navigation = inject<Ref<NavigationItem[]>>('navigation', ref([]))
const menuDrawerOpen = ref(false)
const onThisPageDrawerOpen = ref(false)

const route = useRoute()
const nuxtApp = useNuxtApp()
const { version, docsVersion, instanceKey: docsInstanceKey } = useDocsVersion()
const { headerLinks } = useHeaderLinks()
const { isAgentDocked } = useNuxtAgent()
const path = computed(() => route.path.replace(/\/$/, ''))

const ignoredPaths = ['.nuxt', '.output', '.env', 'node_modules']
const navClass = (item: NavigationItem) => {
  if (ignoredPaths.includes(item.title) && !route.path.includes(item.path)) {
    return 'opacity-70 hover:opacity-100'
  }
  return ''
}

const asideNavigation = computed(() => {
  const sections = navPageFromPath(version.value.path, navigation.value)?.children ?? []
  const section = sections.find(item => path.value === item.path || path.value.startsWith(`${item.path}/`))

  return (section?.children ?? []).map(item => ({
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

const pageKey = computed(() => kebabCase(path.value))

const versioned = computed(() => isVersionedDocsPath(path.value))

const isCliPage = computed(() => {
  const prefix = cliDocsPathPrefix(docsVersion.value)
  return path.value === prefix || path.value.startsWith(`${prefix}/`)
})

const instanceKey = computed(() => {
  if (!versioned.value) return 'examples' as const
  return isCliPage.value ? cliInstanceKey(docsVersion.value) : docsInstanceKey.value
})

const { data: page, status } = await useAsyncData(pageKey, () => {
  const pagePath = path.value
  const client = useContent(instanceKey.value)
  return paintResponse().then(() => client.get(pagePath))
})

const surround = computed(() => findSurroundLinks(navigation.value, path.value))

const fm = computed<Record<string, any>>(() => page.value?.data ?? {})
const tocLinks = computed<any[]>(() => (page.value?.meta as any)?.toc?.links ?? [])

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
const currentSectionTitle = computed(() =>
  headerLinks.value[0]?.children?.find(link => path.value.includes(link.to))?.label
  || findBreadcrumb(navigation.value, path.value).slice(-1)[0]?.title
  || '')

const breadcrumb = computed(() => {
  const links = findBreadcrumb(navigation.value, path.value).map(item => ({
    label: item.title,
    to: item.path
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
const editLink = computed(() => {
  const meta = page.value?.meta
  if (!meta) return ''
  if (instanceKey.value === 'examples') {
    return `https://github.com/nuxt/examples/edit/main/.docs/${meta.stem}${meta.extension}`
  }

  if (isCliPage.value) {
    const ref = CLI_DOCS_REFS[docsVersion.value].branch
    return `https://github.com/${CLI_DOCS_REPO}/edit/${ref}/docs/${meta.stem}${meta.extension}`
  }

  const ref = DOCS_REFS[docsVersion.value].branch
  return `https://github.com/${DOCS_REPO}/edit/${ref}/docs/${meta.stem}${meta.extension}`
})

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

const title = computed(() => fm.value.seo?.title || fm.value.title)

const titleTemplate = computed(() => {
  const template = findTitleTemplate(page, navigation, version.value.path)
  return versioned.value ? `${template} ${version.value.shortTag}` : template
})

useSeoMeta({
  titleTemplate,
  title
})
// Only emit canonical/markdown alternate on versioned paths (e.g.
// `/docs/4.x/*`). Unversioned `/docs/*` URLs are meta-refresh stubs that
// the docs-version middleware redirects to the active version, so agents
// should not treat the stub URL as authoritative. The supported version
// list lives in `shared/utils/docs.ts`.
if (SUPPORTED_DOCS_PATH_REGEX.test(path.value)) {
  useCanonical(() => `${path.value}.md`)
}

if (import.meta.server) {
  useSchemaOrg([
    defineArticle({
      '@type': 'TechArticle',
      'headline': fm.value.title,
      'description': fm.value.seo?.description || fm.value.description
    }),
    defineBreadcrumb({
      itemListElement: breadcrumb.value.map(item => ({
        name: item.label,
        item: item.to
      }))
    })
  ])

  const description = fm.value.seo?.description || fm.value.description
  useSeoMeta({
    description,
    ogDescription: description,
    ogTitle: titleTemplate.value?.includes('%s') ? titleTemplate.value.replace('%s', title.value) : title.value
  })

  defineOgImage('Docs.takumi', {
    headline: breadcrumb.value.length ? breadcrumb.value.map(link => link.label).join(' > ') : '',
    title,
    description
  })
}

function refreshHeading(opened: boolean) {
  if (!opened) return
  nextTick(() => nuxtApp.callHook('page:loading:end'))
}

const noRightAside = computed(() => route.path.includes('/examples/'))
</script>

<template>
  <UContainer v-if="page">
    <DocsVersionAlert />
    <!-- mobile -->
    <div class="lg:hidden sticky top-(--ui-header-height) z-10 bg-default/75 backdrop-blur -mx-4 sm:-mx-6 p-6 border-b border-dashed border-default flex justify-between">
      <UDrawer
        v-model:open="menuDrawerOpen"
        direction="left"
        :title="currentSectionTitle"
        inset
        :handle="false"
        side="left"
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
        v-if="!noRightAside"
        v-model:open="onThisPageDrawerOpen"
        direction="right"
        :handle="false"
        side="right"
        inset
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
            :links="tocLinks"
            :community-links="communityLinks"
            :open="true"
            default-open
            drawer
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
      <UPage
        :ui="isAgentDocked || noRightAside ? {
          center: 'lg:col-span-10',
          right: 'hidden'
        } : { root: 'lg:grid-cols-12', center: 'lg:col-span-9', right: 'hidden lg:flex lg:col-span-3' }"
      >
        <UPageHeader
          :ui="{
            wrapper: 'flex-row items-center flex-wrap justify-between'
          }"
          v-bind="fm"
        >
          <template #headline>
            <UBreadcrumb :items="breadcrumb" />
          </template>

          <template #title>
            {{ fm.title }}

            <UBadge
              v-if="fm.minimalVersion?.trim()"
              :label="`v${fm.minimalVersion?.trim()}`"
              color="info"
              variant="subtle"
              size="lg"
              class="align-middle"
              :aria-label="`Minimum Nuxt version: v${fm.minimalVersion?.trim()}`"
            />
          </template>

          <template #links>
            <UButton
              v-for="link in fm.links?.map((link: any) => ({ ...link, size: 'md' }))"
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
          <MarkdownDocument v-if="page.nodes?.length" :value="page" :components="{ img: DocsProseImg }" />
          <div>
            <Feedback :page="{ title: fm.title, stem: page.meta.stem }" />
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
            v-if="!noRightAside"
            :links="tocLinks"
            :community-links="communityLinks"
            highlight
            highlight-variant="circuit"
            class="lg:backdrop-blur-none lg:overflow-y-auto"
            :ui="{
              container: 'lg:max-h-[inherit]',
              content: 'lg:min-h-[min(var(--list-height,8rem),8rem)]'
            }"
          />
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
