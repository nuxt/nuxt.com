<script lang="ts" setup>
definePageMeta({
  heroBackground: 'opacity-30 -z-10'
})
const route = useRoute()
const { slug } = route.params

const { data: provider } = await useAsyncData('hosting-provider', () => queryCollection('deploy').path(route.path).first())
if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'Hosting Platform not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('deploy', route.path, {
    fields: ['description']
  })
})

const title = provider.value.title
const description = provider.value.description

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

const links = []
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
  to: `https://github.com/nuxt/nuxt.com/edit/main/content/3.deploy/${slug}.md`,
  target: '_blank'
})
</script>

<template>
  <UContainer>
    <UPage>
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
            <NuxtImg v-else :src="provider.logoSrc" class="size-10" />

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
          <UContentToc :links="provider.body.toc.links">
            <template #bottom>
              <div class="hidden lg:block space-y-6" :class="{ '!mt-6': provider.body?.toc?.links?.length }">
                <UDivider v-if="links?.length && provider.body?.toc?.links?.length" type="dashed" />
                <UPageLinks title="Links" :links="links" />
                <UDivider type="dashed" />
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
