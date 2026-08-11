<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { clientContent } from '~/composables/client-content'

definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const { fetchList, filteredJobs } = useEnterpriseJobs()

const { data: page } = await useAsyncData('jobs-landing', () => clientContent.get('/enterprise/jobs'))
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.data.head?.title || page.value.data.title
const description = page.value.data.head?.description || page.value.data.description
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: title
})
useCanonical()

defineOgImage('Docs.takumi', {
  headline: 'Enterprise',
  title,
  description
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero
      :title="page.data.title"
      :description="page.data.description"
      :links="(page.data.links as ButtonProps[])"
      :ui="{
        title: 'text-left',
        description: 'text-left',
        links: 'justify-start'
      }"
    />

    <UPage id="smooth" class="pt-20 -mt-20">
      <UPageBody>
        <UContainer class="space-y-8">
          <UPageCard
            v-for="(job, index) in filteredJobs"
            :key="index"
            :to="job.link"
            :title="job.title"
            :description="job.description"
          >
            <template #leading>
              <UAvatar :src="job.organization.avatar" size="lg" />
            </template>

            <template #footer>
              <div class="flex flex-wrap gap-3">
                <UBadge
                  v-for="location of job.locations"
                  :key="location"
                  :label="location"
                  size="lg"
                  variant="subtle"
                />
                <UBadge :label="job.remote" size="lg" variant="subtle" />
              </div>
            </template>
          </UPageCard>
        </UContainer>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
