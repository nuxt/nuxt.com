<script setup lang="ts">
import type { Module } from '~/types'
import { ModuleProseA, ModuleProseImg } from '#components'

definePageMeta({
  heroBackground: 'opacity-30'
})
const route = useRoute()

const { data: module } = await useFetch<Module>(`https://api.nuxt.com/modules/${route.params.slug}`, {
  key: `module-${route.params.slug}`
})
if (!module.value) {
  throw createError({ statusCode: 404, statusMessage: 'Module not found', fatal: true })
}

const ownerName = computed(() => {
  const [owner, name] = module.value.repo.split('#')[0].split('/')
  return `${owner}/${name}`
})

const links = computed(() => [{
  icon: 'i-ph-book-bookmark-duotone',
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
  icon: 'i-ph-link',
  label: 'Learn more',
  to: module.value.learn_more,
  target: '_blank'
}].filter(Boolean))

const contributors = computed(() => module.value.contributors.map(contributor => ({
  label: contributor.username,
  to: `https://github.com/${contributor.username}`,
  avatar: {
    src: `https://ipx.nuxt.com/f_auto,s_20x20/gh_avatar/${contributor.username}`,
    srcset: `https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/${contributor.username} 2x`,
    alt: contributor.username
  }
})))

const title = module.value.name.charAt(0).toUpperCase() + module.value.name.slice(1)
const description = module.value.description || 'A Nuxt module'

useSeoMeta({
  titleTemplate: '%s · Nuxt Modules',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Modules`
})

defineOgImageComponent('Docs', {
  headline: 'Nuxt Modules'
})
</script>

<template>
  <UContainer class="z-30">
    <div v-if="!module.compatibility?.nuxt?.includes('^3') && !module.compatibility?.nuxt?.includes('>=3')" class="pt-8">
      <UAlert
        icon="i-ph-warning-duotone"
        color="orange"
        variant="subtle"
        title="This module is not yet compatible with Nuxt 3"
      >
        <template #description>
          Head over to <NuxtLink to="https://v2.nuxt.com" target="_blank" class="underline">
            v2.nuxt.com
          </NuxtLink>
        </template>
      </UAlert>
    </div>
    <UPageHeader :description="module.description" :ui="{ headline: 'mb-8' }">
      <template #headline>
        <UBreadcrumb :links="[{ label: 'Modules', to: '/modules', icon: 'i-ph-puzzle-piece-duotone' }, { to: { name: 'modules', query: { category: module.category } }, label: module.category }, { label: module.npm }]" />
      </template>
      <template #title>
        <div class="flex items-center gap-4">
          <UAvatar
            :src="moduleImage(module.icon)"
            :icon="moduleIcon(module.category)"
            :alt="module.name"
            size="lg"
            :ui="{ rounded: 'rounded-lg' }"
            class="-m-[4px]"
          />

          <div>
            {{ module.name }}

            <UTooltip v-if="module.type === 'official'" text="Official module" class="tracking-normal">
              <UIcon name="i-ph-medal-duotone" class="h-6 w-6 text-primary" />
            </UTooltip>
          </div>
        </div>
      </template>

      <div class="flex flex-col lg:flex-row lg:items-center gap-3 mt-4">
        <UTooltip text="Monthly NPM Downloads">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://npmjs.org/package/${module.npm}`" target="_blank">
            <UIcon name="i-ph-arrow-circle-down-duotone" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.downloads) }} downloads</span>
          </NuxtLink>
        </UTooltip>

        <span class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <UTooltip text="GitHub Stars">
          <NuxtLink class="flex items-center gap-1.5" :to="`https://github.com/${module.repo}`" target="_blank">
            <UIcon name="i-ph-star-duotone" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">{{ formatNumber(module.stats.stars || 0) }} stars</span>
          </NuxtLink>
        </UTooltip>

        <span class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>

        <UTooltip text="Latest Version">
          <NuxtLink class="flex items-center gap-1.5" :to="`${module.github}/releases`" target="_blank">
            <UIcon name="i-ph-tag-duotone" class="w-5 h-5 flex-shrink-0" />
            <span class="text-sm font-medium">v{{ module.stats.version }}</span>
          </NuxtLink>
        </UTooltip>

        <div class="mx-3 h-6 border-l border-gray-200 dark:border-gray-800 w-px hidden lg:block" />

        <div v-for="(maintainer, index) in module.maintainers" :key="maintainer.github" class="flex items-center gap-3">
          <NuxtLink :to="`https://github.com/${maintainer.github}`" target="_blank" class="flex items-center gap-1.5 hover:text-primary">
            <UAvatar :src="`https://ipx.nuxt.com/f_auto,s_20x20/gh_avatar/${maintainer.github}`" :srcset="`https://ipx.nuxt.com/f_auto,s_40x40/gh_avatar/${maintainer.github} 2x`" :alt="maintainer.github" size="2xs" />
            <span class="text-sm font-medium">{{ maintainer.github }}</span>
          </NuxtLink>

          <span v-if="index < module.maintainers.length - 1" class="hidden lg:block text-gray-500 dark:text-gray-400">&bull;</span>
        </div>
      </div>
    </UPageHeader>

    <UPage>
      <UPageBody prose class="dark:text-gray-300 dark:prose-pre:!bg-gray-800/60">
        <ContentRendererMarkdown v-if="module.readme?.body" :value="module.readme" class="module-readme" :components="{ a: ModuleProseA, img: ModuleProseImg }" />
      </UPageBody>

      <template #right>
        <UContentToc :links="module.readme.toc?.links">
          <template #bottom>
            <div class="hidden lg:block space-y-6" :class="{ '!mt-6': module.readme?.toc?.links?.length }">
              <UDivider v-if="module.readme?.toc?.links?.length" type="dashed" />

              <UPageLinks title="Links" :links="links" />

              <UDivider type="dashed" />

              <UPageLinks :links="contributors">
                <template #title>
                  Contributors <UBadge :label="module.contributors.length.toString()" color="gray" size="xs" :ui="{ rounded: 'rounded-full' }" />
                </template>
              </UPageLinks>

              <UDivider type="dashed" />

              <Ads />
            </div>
          </template>
        </UContentToc>
      </template>
    </UPage>
  </UContainer>
</template>

<style lang="postcss">
.module-readme {

  /* empty code lines */
  .shiki code .line:empty {
    @apply hidden;
  }

  /* force rounded on prose code */
  .prose-code {
    @apply rounded-md;
  }

  /* Fix badges */
  p {
    a img {
      @apply inline-block my-0 mr-1;
    }

    a:hover {
      @apply border-none opacity-90;
    }
  }
}
</style>
