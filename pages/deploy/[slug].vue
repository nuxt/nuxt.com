<script lang="ts" setup>
import type { Hosting } from '~/types'
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()
const { slug } = route.params

const { data: provider } = await useAsyncData(route.path, () => queryContent<Hosting>(route.path).findOne())
if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'Hosting Platform not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/deploy')
  .where({ _extension: 'md' })
  .without(['body', 'excerpt'])
  .sort({ featured: 1 })
  .findSurround(withoutTrailingSlash(route.path))
)

const title = provider.value.head?.title || provider.value.title
const description = provider.value.head?.description || provider.value.description

useSeoMeta({
  titleTemplate: 'Deploy Nuxt to %s',
  title,
  description,
  ogDescription: description,
  ogTitle: `Deploy Nuxt to ${title}`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Deploy To'
})

const links = []
if (provider.value?.website) {
  links.push({
    icon: 'i-ph-globe-duotone',
    label: provider.value?.title,
    to: provider.value?.website,
    target: '_blank'
  })
}
if (provider.value?.nitroPreset) {
  links.push({
    icon: 'i-ph-lightning-duotone',
    label: 'Nitro Preset',
    to: `https://nitro.unjs.io/deploy/providers/${provider.value?.nitroPreset}`,
    target: '_blank'
  })
}
links.push({
  icon: 'i-ph-pen-duotone',
  label: 'Edit this page',
  to: `https://github.com/nuxt/nuxt.com/edit/main/content/3.deploy/${slug}.md`,
  target: '_blank'
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :description="provider.description" headline="Deploy" :ui="{ icon: { base: 'text-black dark:text-white' } }">
        <template #title>
          <div class="flex items-center gap-4">
            <UIcon v-if="provider.logoIcon" :name="provider.logoIcon" class="w-10 text-black dark:text-white" />
            <NuxtImg v-else :src="provider.logoSrc" class="w-10 h-10" />

            <span>{{ provider.title }}</span>
          </div>
        </template>

        <div class="absolute top-[68px] -left-[64px] hidden lg:flex">
          <UTooltip text="Back to deployments">
            <UButton
              to="/deploy"
              icon="i-ph-caret-left"
              color="gray"
              :ui="{ rounded: 'rounded-full' }"
              size="lg"
            />
          </UTooltip>
        </div>
      </UPageHeader>

      <UPage>
        <UPageBody prose>
          <ContentRenderer v-if="provider && provider.body" :value="provider" />

          <hr v-if="surround?.length">

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc :links="provider.body.toc.links">
            <template #bottom>
              <div class="hidden lg:block space-y-6" :class="{ '!mt-6': provider.body?.toc?.links?.length }">
                <UDivider v-if="links?.length && provider.body?.toc?.links?.length" type="dashed" />

                <UPageLinks title="Links" :links="links" />

                <UDivider type="dashed" />

                <Ads />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
