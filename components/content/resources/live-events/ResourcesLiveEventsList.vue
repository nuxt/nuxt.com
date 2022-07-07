<template>
  <Page>
    <ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="data in liveEventsData" :key="data.id">
        <ResourcesLiveEventsCard :page="data" />
      </li>
    </ul>
  </Page>
</template>

<script setup lang="ts">
import type { ResourcesLiveEvent } from '~/types'

const { data: liveEventsData } = await useAsyncData('resources-live-events', () => queryContent<ResourcesLiveEvent>('/resources/live-events/_collections').find())
</script>
