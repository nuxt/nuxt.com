<script lang="ts" setup>
import type { Integration } from '~/types'
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()

const { data: integration } = await useAsyncData(route.path, () => queryContent<Integration>(route.path).findOne())
if (!integration.value) {
  throw createError({ statusCode: 404, statusMessage: 'Integration not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/integrations')
  .where({ _extension: 'md' })
  .without(['body', 'excerpt'])
  .sort({ date: -1 })
  .findSurround(withoutTrailingSlash(route.path))
)

useSeoMeta({
  title: integration.value.head?.title || integration.value.title,
  description: integration.value.head?.description || integration.value.description
})

const title = integration.value.head?.title || integration.value.title
const description = integration.value.head?.description || integration.value.description
useSeoMeta({
  titleTemplate: '%s · Nuxt Integrations',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Integrations`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Integrations'
})

const links = [
  {
    icon: 'i-ph-lightning-duotone',
    label: 'View on Nitro',
    to: `https://nitro.unjs.io/deploy/providers/${integration.value._path.split('/')[2]}`,
    target: '_blank'
  }
]
</script>

<template>
  <UContainer :ui="{ base: 'my-4 md:my-8 lg:mt-20' }">
    <UPage>
      <UPageHeader v-bind="integration" :ui="{ wrapper: 'mb-8 lg:ml-40', icon: { base: 'text-black dark:text-white' } }">
        <template #title>
          <div class="flex items-center space-x-4">
            <UIcon v-if="integration.logoIcon" :name="integration.logoIcon" class="w-10 h-10 text-black dark:text-white" />
            <NuxtImg v-else :src="integration.logoSrc" class="w-10 h-10" />
            <div>{{ integration.title }}</div>
          </div>
        </template>

        <div class="absolute top-[34px] -left-[72px] hidden lg:flex">
          <UTooltip text="Back to integrations">
            <UButton
              to="/integrations"
              icon="i-ph-caret-left"
              color="gray"
              :ui="{ rounded: 'rounded-full' }"
              size="lg"
            />
          </UTooltip>
        </div>
      </UPageHeader>
      <UPage :ui="{ center: { base: 'lg:ml-40' } }">
        <UPageBody prose>
          <ContentRenderer v-if="integration && integration.body" :value="integration" />
          <UDivider class="py-8" />

          <UDocsSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UDocsToc :links="integration.body.toc.links">
            <template #bottom>
              <UDivider v-if="links" type="dashed" />
              <UPageLinks title="Links" :links="links" />
            </template>
          </UDocsToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
