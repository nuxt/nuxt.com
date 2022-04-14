<template>
  <UContainer class="pb-12" padded>
    <ul class="gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ">
      <li v-for="data in liveEventsData" :key="data.id">
        <ResourcesLiveEventsCard :page="data" />
      </li>
    </ul>
  </UContainer>
</template>

<script setup lang="ts">

const { data: liveEventsData } = await useAsyncData('live-events', () => queryContent('/resources/live-events/collections').find())

</script>
