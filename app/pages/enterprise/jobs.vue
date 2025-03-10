<script setup lang="ts">
definePageMeta({
  heroBackground: 'opacity-80 -z-10'
})
const { fetchList, filteredJobs } = useEnterpriseJobs()

const { data: page } = await useAsyncData('jobs-landing', () => queryCollection('landing').path('/enterprise/jobs').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImageComponent('Docs', {
  headline: 'Enterprise'
})

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero
      :title="title"
      :description="description"
      :links="page.links"
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
