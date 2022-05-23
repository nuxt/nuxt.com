<template>
  <UContainer class="pb-16 sm:pb-32" padded>
    <ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="data in liveEventsData" :key="data.id">
        <ResourcesLiveEventsCard :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">
const { data: liveEventsData } = await useAsyncData('resources-live-events', () => queryContent('/resources/live-events/_collections').find())
</script>
