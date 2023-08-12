<script setup lang="ts">
const route = useRoute()
const { fetchList, filteredJobs } = useEnterpriseJobs()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())

useContentHead(page)

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page">
      <UColorModeImage :light="`${page.image.path}-light.${page.image.format}`" :dark="`${page.image.path}-dark.${page.image.format}`" class="object-contain h-3/4 lg:ml-auto opacity-0 md:opacity-100" :width="page.image.width" :height="page.image.height" />
    </UPageHero>

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
