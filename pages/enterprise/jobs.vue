<script setup lang="ts">
const route = useRoute()
const { fetchList, filteredJobs } = useEnterpriseJobs()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Enterprise'
})

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page" />

    <UPage id="smooth" class="pt-20 -mt-20">
      <UPageBody class="space-y-8">
        <UPageCard
          v-for="(job, index) in filteredJobs"
          :key="index"
          :to="job.link"
          :title="job.title"
          :description="job.description"
          :ui="{
            divide: '',
            footer: { padding: 'pt-0' },
            title: 'text-lg'
          }"
        >
          <template #icon>
            <UAvatar :src="job.organization.avatar" size="lg" />
          </template>

          <template #footer>
            <UBadge
              v-for="location of job.locations"
              :key="location"
              :label="location"
              size="lg"
              variant="subtle"
              class="mr-3"
            />
            <UBadge :label="job.remote" size="lg" variant="subtle" />
          </template>
        </UPageCard>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
