<script lang="ts" setup>
import type { Deployment } from '~/types'
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()
const { slug } = route.params

const { data: deployment } = await useAsyncData(route.path, () => queryContent<Deployment>(route.path).findOne())
if (!deployment.value) {
  throw createError({ statusCode: 404, statusMessage: 'Deployment not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/deployments')
  .where({ _extension: 'md' })
  .without(['body', 'excerpt'])
  .sort({ featured: 1 })
  .findSurround(withoutTrailingSlash(route.path))
)

useSeoMeta({
  title: deployment.value.head?.title || deployment.value.title,
  description: deployment.value.head?.description || deployment.value.description
})

const title = deployment.value.head?.title || deployment.value.title
const description = deployment.value.head?.description || deployment.value.description

useSeoMeta({
  titleTemplate: '%s · Nuxt Deployments',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Nuxt Deployments`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Deployments'
})

const links = []
if (deployment.value?.nitroPreset) {
  links.push({
    icon: 'i-ph-lightning-duotone',
    label: 'View on Nitro Docs',
    to: `https://nitro.unjs.io/deploy/providers/${slug}`,
    target: '_blank'
  })
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader v-bind="deployment" :ui="{ wrapper: 'mb-8 lg:ml-40', icon: { base: 'text-black dark:text-white' } }">
        <template #title>
          <div class="flex items-center space-x-4">
            <UIcon v-if="deployment.logoIcon" :name="deployment.logoIcon" class="w-10 h-10 text-black dark:text-white" />
            <NuxtImg v-else :src="deployment.logoSrc" class="w-10 h-10" />
            <div>{{ deployment.title }}</div>
          </div>
        </template>

        <div class="absolute top-[34px] -left-[72px] hidden lg:flex">
          <UTooltip text="Back to deployments">
            <UButton
              to="/deployments"
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
          <ContentRenderer v-if="deployment && deployment.body" :value="deployment" />
          <UDivider class="py-8" />

          <UDocsSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UDocsToc :links="deployment.body.toc.links">
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
