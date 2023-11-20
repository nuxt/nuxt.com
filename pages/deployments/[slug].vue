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
    to: `https://nitro.unjs.io/deploy/providers/${deployment.value?.nitroPreset}`,
    target: '_blank'
  })
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :description="deployment.description" headline="Deployments" :ui="{ icon: { base: 'text-black dark:text-white' } }">
        <template #title>
          <div class="flex items-center gap-4">
            <UIcon v-if="deployment.logoIcon" :name="deployment.logoIcon" class="w-10 h-10 text-black dark:text-white" />
            <NuxtImg v-else :src="deployment.logoSrc" class="w-10 h-10" />

            <span>{{ deployment.title }}</span>
          </div>
        </template>

        <div class="absolute top-[68px] -left-[64px] hidden lg:flex">
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

      <UPage>
        <UPageBody prose>
          <ContentRenderer v-if="deployment && deployment.body" :value="deployment" />

          <hr v-if="surround?.length">

          <UDocsSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UDocsToc :links="deployment.body.toc.links">
            <template #bottom>
              <div class="hidden lg:block space-y-6" :class="{ '!mt-6': deployment.body?.toc?.links?.length }">
                <UDivider v-if="links?.length && deployment.body?.toc?.links?.length" type="dashed" />

                <UPageLinks title="Links" :links="links" />
              </div>
            </template>
          </UDocsToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
