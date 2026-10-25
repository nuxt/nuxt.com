<script setup lang="ts">
import type { Module } from '#shared/types'
import { supportsNuxt3OrLater } from '#shared/utils/modules'
import { MODULE_DOCS, hasModuleDocs, moduleDocsPathPrefix } from '#shared/utils/module-docs'
import { moduleInstanceKey } from '#shared/utils/content'
import { DocsProseImg, ModuleProseA, ModuleProseKbd, ModuleProseImg } from '#components'

definePageMeta({
  heroBackground: 'opacity-30 -z-10',
  // One page instance per module: moving between its docs pages swaps the content, not the header.
  key: route => `module-${route.params.slug}`
})

const markdownComponents = {
  ...proseComponents,
  ProseA: ModuleProseA,
  ProseImg: ModuleProseImg,
  ProseKbd: ModuleProseKbd
}

// Hosted docs are authored for nuxt.com, so their links and images need no README rewriting.
const docsMarkdownComponents = {
  ...proseComponents,
  ProseImg: DocsProseImg
}

const route = useRoute()
const { isAgentDocked } = useNuxtAgent()

const { data: module } = await useFetch<Module>(`/api/v1/modules/${route.params.slug}`, { key: `module-${route.params.slug}` })
if (!module.value) {
  throw createError({ statusCode: 404, statusMessage: 'Module not found', fatal: true })
}

// Docs navigation and pages only exist for modules with a configured docs source.
const docsName = hasModuleDocs(module.value.name) ? module.value.name : undefined
const docsRoot = docsName && moduleDocsPathPrefix(docsName)
const docsContent = docsName && useContent(moduleInstanceKey(docsName))
const pagePath = computed(() => route.path.replace(/\/$/, ''))
/** A docs page below the module page, as opposed to the module page itself. */
const isDocsPage = computed(() => !!docsRoot && pagePath.value !== docsRoot)

const { data: docsNavigation } = await useAsyncData(`module-docs-nav-${route.params.slug}`, async () => {
  if (!docsContent || !docsRoot) return []
  const tree = await docsContent.navigation()
  const children = navPageFromPath(docsRoot, tree)?.children ?? []
  // The docs `index.md` is the module page; without one, the README stands in for it.
  const items = children.some(item => item.path === docsRoot) ? children : [{ title: 'Overview', path: docsRoot }, ...children]
  // Every docs path starts with the module page's, so only an exact match makes it active.
  return items.map(item => item.path === docsRoot ? { ...item, exact: true } : item)
}, { default: () => [] })

const { data: docsPage, status: docsStatus } = await useAsyncData(
  () => `module-docs-page-${pagePath.value}`,
  () => docsContent ? docsContent.get(pagePath.value) : Promise.resolve(null)
)

watch([pagePath, docsStatus], () => {
  if (docsStatus.value === 'pending') return
  // `/modules/<name>` always renders (docs index or README); any other path must be a docs page.
  if (pagePath.value !== `/modules/${route.params.slug}` && !(isDocsPage.value && docsPage.value)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }
}, { immediate: true })

const docsFm = computed<Record<string, any>>(() => docsPage.value?.data ?? {})
const tocLinks = computed<any[]>(() => docsPage.value
  ? (docsPage.value.meta as any)?.toc?.links ?? []
  : module.value?.readme?.meta?.toc?.links ?? [])

const breadcrumb = computed(() => {
  const moduleLink = { label: module.value!.npm, to: isDocsPage.value ? docsRoot : undefined }
  // Sections without a page of their own (`Guide`) are not links, and the current page is the last item.
  const trail = isDocsPage.value
    ? findBreadcrumb(docsNavigation.value, pagePath.value).map((item, index, all) => ({
        label: item.title,
        to: index < all.length - 1 ? item.path : undefined
      }))
    : []

  return {
    full: [
      { label: 'Modules', to: '/modules' },
      { to: { name: 'modules', query: { category: module.value!.category } }, label: module.value!.category },
      moduleLink,
      ...trail
    ],
    // Mobile docs pages: the module and the docs trail only.
    compact: [moduleLink, ...trail]
  }
})
const surround = computed(() => findSurroundLinks(docsNavigation.value, pagePath.value))

// Below `lg` the asides collapse into drawers, as on `/docs`.
const menuDrawerOpen = ref(false)
const onThisPageDrawerOpen = ref(false)
watch(pagePath, () => {
  menuDrawerOpen.value = false
  onThisPageDrawerOpen.value = false
})
const docsEditLink = computed(() => {
  const meta = docsPage.value?.meta
  if (!docsName || !meta) return ''
  const { repo, branch, contentDir } = MODULE_DOCS[docsName]
  return `https://github.com/${repo}/edit/${branch}/${contentDir}/${meta.stem}${meta.extension}`
})

// Reassign the ref (not module.value.health = ...): useFetch `data` is a
// shallowRef, so an in-place nested write would not trigger reactivity.
const { health } = useModuleHealth()
watch(health, (map) => {
  const m = module.value
  if (m && map[m.name] && m.health !== map[m.name]) {
    module.value = { ...m, health: map[m.name] }
  }
})

const ownerName = computed(() => {
  const [owner, name] = module.value!.repo.split('#')[0].split('/')
  return `${owner}/${name}`
})

const links = computed(() => module.value
  ? [{
      icon: 'i-lucide-book',
      label: 'Documentation',
      to: `${module.value.website}?utm_source=nuxt.com&utm_medium=aside-module&utm_campaign=nuxt.com`,
      target: '_blank'
    }, {
      icon: 'i-simple-icons-github',
      label: ownerName.value,
      to: module.value.github,
      target: '_blank'
    }, module.value.npm && {
      icon: 'i-simple-icons-npm',
      label: module.value.npm,
      to: `https://npmjs.org/package/${module.value.npm}`,
      target: '_blank'
    }, module.value.learn_more && {
      icon: 'i-lucide-link',
      label: 'Learn more',
      to: module.value.learn_more,
      target: '_blank'
    }].filter(Boolean)
  : [])

const contributors = computed(() => {
  // A Nuxter profile when the contributor has one, GitHub otherwise (module repositories outside the Nuxt orgs).
  const allContributors = module.value.contributors.map(contributor => ({
    label: contributor.username,
    to: contributor.nuxter ? `/nuxters/${contributor.username}` : `https://github.com/${contributor.username}`,
    avatar: {
      provider: 'ipx',
      src: `https://ipx.nuxt.com/f_auto,s_20x20/gh_avatar/${contributor.username}`,
      srcset: `https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/${contributor.username} 2x`,
      alt: contributor.username
    }
  }))
  if (allContributors.length > 10) {
    return [...allContributors.slice(0, 10), {
      label: 'View all contributors',
      to: `https://github.com/${module.value.repo}/graphs/contributors`,
      external: true,
      target: '_blank',
      noAvatar: true
    }]
  }

  return allContributors
})

// Collapsed to a couple of rows so the README stays above the fold. The rest
// is hidden with `v-show`, so every provider stays in the server-rendered HTML.
const PROVIDERS_PREVIEW = 12
const showAllProviders = ref(false)

const title = computed(() => isDocsPage.value ? `${docsFm.value.title} · ${module.value!.npm}` : module.value!.npm)
const description = computed(() => (isDocsPage.value && docsFm.value.description) || module.value!.description || 'A Nuxt module')
const publishedAgo = useTimeAgo(module.value.stats.publishedAt)
const createdAgo = useTimeAgo(module.value.stats.createdAt)

useSeoMeta({
  titleTemplate: '%s · Nuxt Modules',
  title,
  description
})
useCanonical()

if (import.meta.server) {
  useSeoMeta({
    ogDescription: description,
    ogTitle: `${title.value} · Nuxt Modules`
  })

  defineOgImage('Module.takumi', {
    icon: module.value?.icon,
    headline: 'Nuxt Modules',
    title: title.value,
    description: description.value
  })
}
</script>

<template>
  <UContainer v-if="module">
    <div v-if="!supportsNuxt3OrLater(module.compatibility?.nuxt)" class="pt-8">
      <UAlert
        icon="i-lucide-triangle-alert"
        variant="subtle"
        title="This module is not yet compatible with Nuxt 3"
      >
        <template #description>
          Head over to the <NuxtLink to="/docs/2.x/getting-started/installation" class="underline">
            Nuxt 2 docs
          </NuxtLink>
        </template>
      </UAlert>
    </div>
    <UPageHeader
      :description="module.description"
      :ui="{
        // On a mobile docs page, the breadcrumb and module name are enough context above the content.
        root: isDocsPage ? 'py-6 lg:py-8' : '',
        headline: isDocsPage ? 'mb-4 lg:mb-8' : 'mb-8',
        description: isDocsPage ? 'hidden lg:block' : '',
        wrapper: isAgentDocked
          ? 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'
          : 'flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center',
        title: isAgentDocked ? '' : 'lg:col-span-9',
        links: isAgentDocked ? '' : 'lg:col-span-3 lg:justify-start lg:pl-6'
      }"
    >
      <template #headline>
        <UBreadcrumb :items="breadcrumb.full" :class="isDocsPage ? 'hidden lg:block' : ''" />
        <UBreadcrumb v-if="isDocsPage" :items="breadcrumb.compact" class="lg:hidden" />
      </template>
      <template #title>
        <div class="flex items-center gap-4">
          <UAvatar
            :src="moduleImage(module.icon)"
            :icon="moduleIcon(module.category)"
            :alt="module.name"
            size="xl"
            class="-m-1 rounded-none bg-transparent"
          />

          <div>
            {{ module.npm }}

            <UTooltip v-if="module.type === 'official'" text="Official module" class="tracking-normal">
              <UIcon name="i-lucide-medal" class="size-6 text-primary" />
            </UTooltip>
          </div>
        </div>
      </template>

      <template #links>
        <ModuleInstallGroup :module="module" class="hidden lg:flex" />
      </template>

      <div class="flex-col lg:flex-row lg:items-center gap-3 mt-4" :class="isDocsPage ? 'hidden lg:flex' : 'flex'">
        <UTooltip text="Monthly NPM Downloads">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://npmx.dev/package-stats/${module.npm}/v/${module.stats.version}?granularity=monthly`" target="_blank">
            <UIcon name="i-lucide-circle-arrow-down" class="size-5 shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }} downloads</span>
          </NuxtLink>
        </UTooltip>

        <span class="hidden lg:block text-muted">&bull;</span>

        <UTooltip text="GitHub Stars">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://github.com/${(module.repo || '').split('#')[0]}`" target="_blank">
            <UIcon name="i-lucide-star" class="size-5 shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }} stars</span>
          </NuxtLink>
        </UTooltip>

        <span class="hidden lg:block text-muted">&bull;</span>

        <UTooltip text="Latest Version">
          <NuxtLink class="flex items-center gap-1.5" :to="`${(module.github || '').split('/tree/main/')[0]}/releases`" target="_blank">
            <UIcon name="i-lucide-tag" class="size-5 shrink-0" />
            <span class="text-sm font-medium">v{{ module.stats.version }}</span>
          </NuxtLink>
        </UTooltip>

        <template v-if="module.health">
          <span class="hidden lg:block text-muted">&bull;</span>
          <UTooltip :text="`Health: ${module.health.status} - ${module.health.score}/100`">
            <NuxtLink
              :to="`https://nuxt.care/?search=npm:${module.npm}`"
              class="flex items-center gap-1.5"
              target="_blank"
            >
              <UIcon name="i-lucide-heart-pulse" class="size-5 shrink-0" :style="{ color: module.health.color }" />
              <span class="text-sm font-medium">{{ module.health.score }}</span>
            </NuxtLink>
          </UTooltip>
        </template>

        <div class="mx-3 h-6 border-l border-gray-200 dark:border-gray-800 w-px hidden lg:block" />

        <div v-for="(maintainer, index) in module.maintainers" :key="maintainer.github" class="flex items-center gap-3">
          <NuxtLink
            :to="maintainer.nuxter ? `/nuxters/${maintainer.github}` : `https://github.com/${maintainer.github}`"
            :target="maintainer.nuxter ? undefined : '_blank'"
            class="flex items-center gap-1.5 hover:text-primary"
          >
            <UAvatar provider="ipx" :src="`https://ipx.nuxt.com/f_auto,s_20x20/gh_avatar/${maintainer.github}`" :srcset="`https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/${maintainer.github} 2x`" :alt="maintainer.github" size="xs" />
            <span class="text-sm font-medium">{{ maintainer.github }}</span>
          </NuxtLink>

          <span v-if="index < module.maintainers.length - 1" class="hidden lg:block text-muted">&bull;</span>
        </div>
      </div>

      <ModuleInstallGroup v-if="!isDocsPage" :module="module" class="w-full mt-6 lg:hidden" />
    </UPageHeader>

    <div
      v-if="docsNavigation.length"
      class="lg:hidden sticky top-(--ui-header-height) z-10 bg-default/75 backdrop-blur -mx-4 sm:-mx-6 p-6 border-b border-dashed border-default flex justify-between"
    >
      <UDrawer
        v-model:open="menuDrawerOpen"
        direction="left"
        :title="module.npm"
        inset
        :handle="false"
        :ui="{ content: 'w-full max-w-2/3' }"
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
            :navigation="docsNavigation"
            :collapsible="false"
            :ui="{ link: 'data-[state=open]:text-muted data-[state=open]:hover:text-highlighted', trigger: 'font-normal' }"
            highlight
          />
        </template>
      </UDrawer>
      <UDrawer
        v-if="tocLinks.length"
        v-model:open="onThisPageDrawerOpen"
        direction="right"
        :handle="false"
        inset
        no-body-styles
        :ui="{ content: 'w-full max-w-2/3' }"
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
          <UContentToc
            :links="tocLinks"
            :open="true"
            default-open
            :ui="{
              root: '!mx-0 !px-1 top-0 overflow-visible',
              container: '!pt-0 border-b-0',
              trailingIcon: 'hidden'
            }"
          />
        </template>
      </UDrawer>
    </div>

    <UPage
      :ui="isAgentDocked ? {
        center: docsNavigation.length ? 'lg:col-span-8' : 'lg:col-span-10',
        right: 'lg:hidden'
      } : docsNavigation.length
        // The mobile bar above replaces the right aside's collapsible table of contents.
        ? { root: 'lg:grid-cols-12', left: 'lg:col-span-2', center: 'lg:col-span-7', right: 'hidden lg:flex lg:col-span-3' }
        : { root: 'lg:grid-cols-12', center: 'lg:col-span-9', right: 'lg:col-span-3' }"
    >
      <template v-if="docsNavigation.length" #left>
        <UPageAside>
          <UContentNavigation
            :navigation="docsNavigation"
            :collapsible="false"
            :ui="{ link: 'data-[state=open]:text-muted data-[state=open]:hover:text-highlighted', trigger: 'font-normal' }"
            highlight
          />
        </UPageAside>
      </template>

      <UPageBody>
        <section v-if="!isDocsPage && module.providers?.length" class="mb-10">
          <h2 class="flex items-center gap-2 mb-4 text-lg font-semibold text-highlighted">
            Supported providers
            <UBadge :label="String(module.providers.length)" color="neutral" variant="subtle" size="sm" class="rounded-full" />
          </h2>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="(provider, index) in module.providers"
              v-show="showAllProviders || index < PROVIDERS_PREVIEW"
              :key="provider.name"
              :to="provider.docs"
              :target="provider.docs ? '_blank' : undefined"
              :icon="provider.icon || 'i-lucide-plug'"
              :label="provider.label"
              color="neutral"
              variant="outline"
              size="sm"
            />
            <UButton
              v-if="module.providers.length > PROVIDERS_PREVIEW"
              :label="showAllProviders ? 'Show less' : `Show all ${module.providers.length}`"
              :trailing-icon="showAllProviders ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="showAllProviders = !showAllProviders"
            />
          </div>
        </section>

        <template v-if="docsPage">
          <div v-if="isDocsPage">
            <h1 class="text-3xl font-bold text-highlighted">
              {{ docsFm.title }}
            </h1>
            <p v-if="docsFm.description" class="mt-2 text-lg text-muted">
              {{ docsFm.description }}
            </p>
          </div>
          <MarkdownDocument v-if="docsPage.nodes?.length" :value="docsPage" :components="docsMarkdownComponents" />
          <div>
            <USeparator class="mt-6 mb-10">
              <UButton
                size="sm"
                variant="link"
                color="neutral"
                :to="docsEditLink"
                target="_blank"
                label="Edit this page on GitHub"
              />
            </USeparator>
            <UContentSurround :surround="surround" />
          </div>
        </template>

        <MarkdownDocument
          v-else-if="!isDocsPage && module.readme?.nodes?.length"
          :value="module.readme"
          :components="markdownComponents"
          class="first:[&_picture]:block first:[&_picture]:mb-4"
        />
      </UPageBody>

      <template #right>
        <UContentToc :links="tocLinks">
          <template #bottom>
            <div class="hidden lg:block space-y-6">
              <UPageLinks title="Links" :links="links" />

              <USeparator type="dashed" />

              <UPageLinks
                title="Details"
                :links="[
                  {
                    label: `Updated ${publishedAgo}`,
                    to: `https://github.com/${module.repo}`,
                    icon: 'i-lucide-radio'
                  },
                  {
                    label: `Created ${createdAgo}`,
                    to: `https://github.com/${module.repo}`,
                    icon: 'i-lucide-package'
                  }
                ]"
              />

              <UPageLinks :links="contributors">
                <template #title>
                  Contributors <UBadge :label="module.contributors.length.toString()" color="neutral" variant="subtle" size="sm" class="rounded-full" />
                </template>

                <template #link-leading="{ link }">
                  <UAvatar v-if="!(link as any).noAvatar" provider="ipx" :src="`https://ipx.nuxt.com/f_auto,s_20x20/gh_avatar/${link.label}`" :srcset="`https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/${link.label} 2x`" class="size-5" />
                </template>
              </UPageLinks>
              <USeparator type="dashed" />
              <SocialLinks />
            </div>
          </template>
        </UContentToc>
      </template>
    </UPage>
  </UContainer>
</template>
