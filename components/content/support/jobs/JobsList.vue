<template>
  <div class="relative overflow-hidden">
    <Page v-if="!error" id="smooth" class="relative pt-16 -mt-16">
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
    <Page v-else>
      <p class="text-center">
        Sorry an error occured while fetching offers...
      </p>
    </Page>
  </div>
</template>

<script setup lang="ts">
const { fetchList, filteredJobs, selectedLocation, selectedType } = useNuxtJobs()

const error = await fetchList()
</script>
