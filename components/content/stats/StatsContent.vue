<template>
  <Page>
    <h1 class="text-4xl font-semibold tracking-tight u-text-gray-900 sm:text-5xl">
      Stats
    </h1>
    <div class="flex justify-between items-center gap-2 mt-8">
      <p class="font-semibold text-xl">
        Total downloads this {{ range }}: {{ totalDownloads.toLocaleString() }}
      </p>
      <USelect v-model="range" name="downloads-range" :options="rangeOptions" class="flex-shrink-0" @update:model-value="() => refreshDownloads()" />
    </div>
    <UCard padded class="mt-4">
      <StatsChartLine :data="downloadsChartData" />
    </UCard>
    <div class="flex justify-between items-center mt-8">
      <p class="font-semibold text-xl">
        Versions downloads this week
      </p>
    </div>
    <UCard padded class="mt-4">
      <StatsChartPie :data="versionsChartData" />
    </UCard>
  </Page>
</template>

<script setup lang="ts">
import type { NpmJsDownloadsRange, NpmJsVersions } from '~/types'

const range = ref('month')
const rangeOptions = [
  { text: 'Last month', value: 'month' },
  { text: 'Last week', value: 'week' }
]

const { data: downloads, refresh: refreshDownloads } = await useAsyncData('stats-downloads-range', () => $fetch<NpmJsDownloadsRange>(
  `/api/stats/downloads-range/${range.value}`
))
const { data: versions } = await useAsyncData('stats-versions', () => $fetch<NpmJsVersions>('/api/stats/versions'))

const totalDownloads = computed(() => {
  return downloads.value.downloads.reduce((acc, { downloads }) => {
    return acc + downloads
  }, 0)
})

const downloadsPerVersions = computed(() => {
  return Object.entries(
    Object.entries(versions.value.downloads)
      .reduce((acc, value) => {
        const majorVersion = `v${value[0].split('.')[0]}`
        if (!acc[majorVersion]) {
          acc[majorVersion] = 0
        }
        acc[majorVersion] += value[1]
        return acc
      }, {} as { [key: string]: number })
  ).sort((a, b) => (b[1]) - (a[1])).filter(version => !['v0'].includes(version[0]))
})

const downloadsChartData = computed(() => {
  const labels = downloads.value.downloads.map(({ day }) => day)
  const data = downloads.value.downloads.map(({ downloads }) => downloads)
  return {
    labels,
    datasets: [{
      label: 'Nuxt Downloads',
      data
    }]
  }
})

const versionsChartData = computed(() => {
  const labels = downloadsPerVersions.value.map(({ 0: label }) => label)
  const data = downloadsPerVersions.value.map(({ 1: downloads }) => downloads)
  return {
    labels,
    datasets: [{
      data
    }]
  }
})
</script>
