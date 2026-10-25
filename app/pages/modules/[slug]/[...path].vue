<script setup lang="ts">
import type { Module } from '#shared/types'
import { supportsNuxt3OrLater } from '#shared/utils/modules'
import { MODULE_DOCS, hasModuleDocs, moduleDocsPathPrefix } from '#shared/utils/module-docs'
import { moduleInstanceKey } from '#shared/utils/content'
import { ModuleProseA, ModuleProseKbd, ModuleProseImg } from '#components'

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

const route = useRoute()
const { isAgentDocked } = useNuxtAgent()

// The slug is the module's registry name, so the docs can be fetched alongside the module.
const slug = route.params.slug as string
const docsName = hasModuleDocs(slug) ? slug : undefined
const docsRoot = docsName && moduleDocsPathPrefix(docsName)
const docsContent = docsName && useContent(moduleInstanceKey(docsName))
const pagePath = computed(() => route.path.replace(/\/$/, ''))
/** A docs page below the module page, as opposed to the module page itself. */
const isDocsPage = computed(() => !!docsRoot && pagePath.value !== docsRoot)
// A `computed` key, not a getter: the build's async-data handler extraction mistakes a getter key for a handler.
const docsPageKey = computed(() => `module-docs-page-${pagePath.value}`)

const [{ data: module }, { data: docsNavigation }, { data: docsPage, status: docsStatus }] = await Promise.all([
  useFetch<Module>(`/api/v1/modules/${slug}`, { key: `module-${slug}` }),
  // Fetched once per module: the page instance is kept across its docs pages (`key` above).
  useAsyncData(`module-docs-nav-${slug}`, async () => {
    if (!docsContent || !docsRoot) return []
    const tree = await docsContent.navigation()
    // Every docs path starts with the module page's (the docs `index.md`), so only an exact match makes it active.
    return (navPageFromPath(docsRoot, tree)?.children ?? [])
      .map(item => item.path === docsRoot ? { ...item, exact: true } : item)
  }, { default: () => [] }),
  useAsyncData(docsPageKey, () => docsContent ? docsContent.get(pagePath.value) : Promise.resolve(null))
])
if (!module.value) {
  throw createError({ statusCode: 404, statusMessage: 'Module not found', fatal: true })
}

watch([pagePath, docsStatus], () => {
  if (docsStatus.value === 'pending') return
  // `/modules/<name>` always renders (docs index or README); any other path must be a docs page.
  if (pagePath.value !== `/modules/${slug}` && !(isDocsPage.value && docsPage.value)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }
}, { immediate: true })

const docsFm = computed<Record<string, any>>(() => docsPage.value?.data ?? {})
const tocLinks = computed<any[]>(() => docsPage.value
  ? (docsPage.value.meta as any)?.toc?.links ?? []
  : module.value?.readme?.meta?.toc?.links ?? [])

const breadcrumb = computed(() => {
  // On docs pages the module header is gone: its icon marks the module in the breadcrumb instead.
  const moduleLink = isDocsPage.value
    ? {
        label: module.value!.npm,
        to: docsRoot,
        avatar: { src: moduleImage(module.value!.icon), icon: moduleIcon(module.value!.category), alt: module.value!.name, class: 'rounded-none bg-transparent' }
      }
    : { label: module.value!.npm }
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
      { to: `/modules?category=${encodeURIComponent(module.value!.category)}`, label: module.value!.category },
      moduleLink,
      ...trail
    ],
    // Mobile docs pages: the module and the docs trail only.
    compact: [moduleLink, ...trail]
  }
})
const surround = computed(() => findSurroundLinks(docsNavigation.value, pagePath.value))
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
// Hosted docs have a markdown twin for agents, like `/docs` pages.
useCanonical(() => docsName ? `/raw${pagePath.value}.md` : undefined)

if (import.meta.server) {
  useSeoMeta({
    ogDescription: description,
    ogTitle: `${title.value} · Nuxt Modules`
  })

  // A docs page reads like `/docs` ones: the trail above the page title, e.g. `@nuxt/icon > Guide` + `Server Bundle`.
  defineOgImage('Module.takumi', {
    icon: module.value?.icon,
    headline: isDocsPage.value ? breadcrumb.value.compact.slice(0, -1).map(item => item.label).join(' > ') : 'Nuxt Modules',
    title: isDocsPage.value ? docsFm.value.title : module.value!.npm,
    description: description.value
  })

  if (isDocsPage.value) {
    useSchemaOrg([
      defineArticle({
        '@type': 'TechArticle',
        'headline': docsFm.value.title,
        'description': description.value
      }),
      defineBreadcrumb({
        // Sections without a page of their own (`Guide`) have no URL to point at.
        itemListElement: breadcrumb.value.full
          .filter((item, index, all) => item.to || index === all.length - 1)
          .map(item => ({ name: item.label, item: item.to }))
      })
    ])
  }
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
    <!-- Docs-only UI is `Lazy*` at the `ModuleDocs*` boundary: modules without docs never load it.
         On mobile its bar comes first, under the site header, as on `/docs`. -->
    <LazyModuleDocsMobileBar
      v-if="docsNavigation.length"
      :title="module.npm"
      :navigation="docsNavigation"
      :toc-links="tocLinks"
    />

    <!-- The module header belongs to the module page; docs pages only keep the breadcrumb. -->
    <div v-if="isDocsPage" class="pt-8">
      <UBreadcrumb :items="breadcrumb.full" class="hidden lg:block" />
      <UBreadcrumb :items="breadcrumb.compact" class="lg:hidden" />
    </div>
    <UPageHeader
      v-else
      :description="module.description"
      :ui="{
        headline: 'mb-8',
        wrapper: isAgentDocked
          ? 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'
          : 'flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center',
        title: isAgentDocked ? '' : 'lg:col-span-9',
        links: isAgentDocked ? '' : 'lg:col-span-3 lg:justify-start lg:pl-6'
      }"
    >
      <template #headline>
        <UBreadcrumb :items="breadcrumb.full" />
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

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
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

      <ModuleInstallGroup :module="module" class="w-full mt-6 lg:hidden" />
    </UPageHeader>

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
        <LazyModuleDocsAside :navigation="docsNavigation" />
      </template>

      <!-- Docs pages: the title sits under the breadcrumb on mobile, as on `/docs`. -->
      <UPageBody :class="{ 'mt-4 lg:mt-8': isDocsPage }">
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

        <LazyModuleDocsPage
          v-if="docsPage"
          :page="docsPage"
          :with-title="isDocsPage"
          :edit-link="docsEditLink"
          :surround="surround"
        />
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
