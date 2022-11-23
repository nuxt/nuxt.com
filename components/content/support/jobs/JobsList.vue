<template>
  <div class="relative overflow-hidden">
    <Page id="smooth" class="relative pt-16 -mt-16">
      <PageList :title="`${filteredJobs.length} job${filteredJobs.length > 1 ? 's' : ''} found`" :modules-filter="false">
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
  return [...jobs.value.data]
    .filter((job) => {
      if (selectedLocation.value && !job.locations.includes(selectedLocation.value.value)) {
        return false
      }
      if (selectedType.value && job.remote !== selectedType.value.value) {
        return false
      }
      return true
    })
})
</script>
