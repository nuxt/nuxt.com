<script lang="ts" setup>
import { kebabCase } from 'scule'
import type { SourceData } from 'comark-content'
import type { Toc } from 'comark/plugins/toc'
import { clientContent } from '~/composables/client-content'
import { itemSurroundings } from '~/utils/content'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})
const route = useRoute()
const { isAgentDocked } = useNuxtAgent()
const { fetchList, providers } = useHostingProviders()
await fetchList()

const [{ data: provider }, { data: surround }] = await Promise.all([
  useAsyncData(`${kebabCase(route.path)}-provider`, () => clientContent.get<SourceData<'local'>>(route.path)),
  useAsyncData(`${kebabCase(route.path)}-surround`, async () => {
    const items = await clientContent.list('local')
    const pages = items.filter(i => i.path.startsWith('/deploy/') && i.path !== '/deploy')
    const [prev, next] = itemSurroundings(pages, route.path)
    return [prev, next].map(item => item && {
      title: item.data.title,
      description: item.data.description,
      path: item.path
    })
  })
])

if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'Hosting Platform not found', fatal: true })
}

const toc = computed(() => (provider.value?.meta as { toc?: Toc } | undefined)?.toc)

const title = provider.value?.data.title
const description = provider.value?.data.description

useSeoMeta({
  titleTemplate: 'Deploy Nuxt to %s',
  title,
  description,
  ogDescription: description,
  ogTitle: `Deploy Nuxt to ${title}`
})
useCanonical(`${route.path}.md`)

defineOgImage('Docs.takumi', {
  headline: 'Deploy To',
  title,
  description
})

const links = [] as Array<{
  icon: string
  label: string
  to: string
  target?: string
}>

if (provider.value?.data.website) {
  links.push({
    icon: 'i-lucide-globe',
    label: provider.value.data.title || 'Website',
    to: provider.value.data.website,
    target: '_blank'
  })
}
if (provider.value?.data.nitroPreset) {
  links.push({
    icon: 'i-lucide-zap',
    label: 'Nitro Preset',
    to: `https://nitro.unjs.io/deploy/providers/${provider.value.data.nitroPreset}`,
    target: '_blank'
  })
}
links.push({
  icon: 'i-lucide-pen',
  label: 'Edit this page',
  to: `https://github.com/nuxt/nuxt.com/edit/main/content/deploy/${route.params.slug}.md`,
  target: '_blank'
})
</script>

<template>
  <UContainer v-if="provider">
    <UPage>
      <template #left>
        <UPageAside>
          <UNavigationMenu
            variant="pill"
            highlight
            orientation="vertical"
            :items="providers.map(provider => ({
              label: provider.data.title,
              to: provider.path,
              badge: provider.data.sponsor ? 'Sponsor' : undefined
            })).sort((a, b) => a.label.localeCompare(b.label, 'en'))"
          />
        </UPageAside>
      </template>
      <UPageHeader
        :description="provider.data.description"
        :ui="{ headline: 'mb-8' }"
      >
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Deploy', to: '/deploy' }, { label: provider.data.title }]" class="max-w-full" />
        </template>

        <template #title>
          <div class="flex items-center gap-4">
            <UIcon v-if="provider.data.logoIcon" :name="provider.data.logoIcon" class="w-10" />
            <NuxtImg v-else :src="provider.data.logoSrc" width="40" height="40" class="size-10" />

            <span>{{ provider.data.title }}</span>
          </div>
        </template>
      </UPageHeader>

      <UPage
        :ui="isAgentDocked ? {
          center: 'lg:col-span-10',
          right: 'lg:hidden'
        } : { root: 'lg:grid-cols-12', center: 'lg:col-span-9', right: 'lg:col-span-3' }"
      >
        <UPageBody>
          <MarkdownDocument v-if="provider.nodes?.length" :value="provider" />

          <USeparator v-if="surround?.length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc v-if="!isAgentDocked" :links="toc?.links || []">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <USeparator v-if="links?.length && toc?.links?.length" type="dashed" />
                <UPageLinks title="Links" :links="links" />
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
