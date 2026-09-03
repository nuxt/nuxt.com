<script lang="ts" setup>
import { kebabCase } from 'scule'

definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})
const route = useRoute()
const { isAgentDocked } = useNuxtAgent()
const { fetchList, providers } = useHostingProviders()
await fetchList()

const { data: provider } = await useAsyncData(`${kebabCase(route.path)}-provider`, () => useContent('site').get(route.path))

if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'Hosting Platform not found', fatal: true })
}

const providerData = computed(() => provider.value!.data)
const surround = computed(() => listSurround(providers.value, route.path))

const title = providerData.value?.title
const description = providerData.value?.description

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

if (providerData.value?.website) {
  links.push({
    icon: 'i-lucide-globe',
    label: providerData.value?.title,
    to: providerData.value?.website,
    target: '_blank'
  })
}
if (providerData.value?.nitroPreset) {
  links.push({
    icon: 'i-lucide-zap',
    label: 'Nitro Preset',
    to: `https://nitro.unjs.io/deploy/providers/${providerData.value?.nitroPreset}`,
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
  <UContainer v-if="providerData">
    <UPage>
      <template #left>
        <UPageAside>
          <UNavigationMenu
            variant="pill"
            highlight
            orientation="vertical"
            :items="providers.map(item => ({
              label: item.title,
              to: item.path,
              badge: item.sponsor ? 'Sponsor' : undefined
            })).sort((a, b) => a.label.localeCompare(b.label, 'en'))"
          />
        </UPageAside>
      </template>
      <UPageHeader
        :description="providerData.description"
        :ui="{ headline: 'mb-8' }"
      >
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Deploy', to: '/deploy' }, { label: providerData.title }]" class="max-w-full" />
        </template>

        <template #title>
          <div class="flex items-center gap-4">
            <UIcon v-if="providerData.logoIcon" :name="providerData.logoIcon" class="w-10" />
            <NuxtImg v-else :src="providerData.logoSrc" width="40" height="40" class="size-10" />

            <span>{{ providerData.title }}</span>
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
          <MarkdownDocument v-if="provider" :value="provider" />

          <USeparator v-if="surround?.length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc :links="providerData.body?.toc?.links || []">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <USeparator v-if="links?.length && providerData.body?.toc?.links?.length" type="dashed" />
                <UPageLinks title="Links" :links="links" />
                <USeparator type="dashed" />
                <SocialLinks />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
