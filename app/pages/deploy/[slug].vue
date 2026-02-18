<script lang="ts" setup>
import { kebabCase } from 'scule'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})
const route = useRoute()
const { fetchList, providers } = useHostingProviders()
await fetchList()

const [{ data: provider }, { data: surround }] = await Promise.all([
  useAsyncData(`${kebabCase(route.path)}-provider`, () => queryCollection('deploy').path(route.path).first()),
  useAsyncData(`${kebabCase(route.path)}-surround`, () => {
    return queryCollectionItemSurroundings('deploy', route.path, {
      fields: ['description']
    })
  })
])

if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'Hosting Platform not found', fatal: true })
}

const title = provider.value?.title
const description = provider.value?.description

useSeoMeta({
  titleTemplate: 'Deploy Nuxt to %s',
  title,
  description,
  ogDescription: description,
  ogTitle: `Deploy Nuxt to ${title}`
})

defineOgImageComponent('Docs', {
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

if (provider.value?.website) {
  links.push({
    icon: 'i-lucide-globe',
    label: provider.value?.title,
    to: provider.value?.website,
    target: '_blank'
  })
}
if (provider.value?.nitroPreset) {
  links.push({
    icon: 'i-lucide-zap',
    label: 'Nitro Preset',
    to: `https://nitro.unjs.io/deploy/providers/${provider.value?.nitroPreset}`,
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
              label: provider.title,
              to: provider.path,
              badge: provider.sponsor ? 'Sponsor' : undefined
            })).sort((a, b) => a.label.localeCompare(b.label))"
          />
        </UPageAside>
      </template>
      <UPageHeader
        :description="provider.description"
        :ui="{ headline: 'mb-8' }"
      >
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Deploy', to: '/deploy' }, { label: provider.title }]" class="max-w-full" />
        </template>

        <template #title>
          <div class="flex items-center gap-4">
            <UIcon v-if="provider.logoIcon" :name="provider.logoIcon" class="w-10" />
            <NuxtImg v-else :src="provider.logoSrc" width="40" height="40" class="size-10" />

            <span>{{ provider.title }}</span>
          </div>
        </template>
      </UPageHeader>

      <UPage>
        <UPageBody>
          <ContentRenderer v-if="provider && provider.body" :value="provider" />

          <USeparator v-if="surround?.length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc :links="provider.body.toc?.links || []">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <USeparator v-if="links?.length && provider.body?.toc?.links?.length" type="dashed" />
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
