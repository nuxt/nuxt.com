<template>
  <div class="relative overflow-hidden">
    <img src="/assets/community/jobs/gradient.svg" class="absolute right-0 hidden mt-32 lg:block">

    <Page id="smooth" class="relative pt-16 -mt-16">
      <PageList :title="`${filteredJobs.length} job${filteredJobs.length > 1 ? 's' : ''} found`">
        <template #filters>
          <JobsFilterLocation />
          <JobsFilterType />
        </template>

        <ul v-if="filteredJobs.length" class="flex flex-col gap-8 mt-8">
          <li v-for="job in filteredJobs" :key="job.id">
            <JobsListItem :job="job" />
          </li>
        </ul>
        <div v-else class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
          <span class="text-xl font-medium text-center u-text-gray-700">
            No job found.
          </span>
        </div>
      </PageList>
    </Page>
  </div>
</template>

<script setup lang="ts">
const { jobs, selectedLocation, selectedType } = useNuxtJobs()

const filteredJobs = computed(() => {
  return [...jobs.value]
    .filter((job) => {
      if (selectedLocation.value && job.location !== selectedLocation.value.value) {
        return false
      }
      if (selectedType.value && job.type !== selectedType.value.value) {
        return false
      }
      return true
    })
})
</script>
