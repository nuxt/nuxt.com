<template>
  <section>
    <SubNavbar title="Partners" :links="links" />
    <NuxtPage />
  </section>
</template>

<script setup lang="ts">
const links = ref([
  {
    title: 'Support',
    _path: '/partners/support'
  },
  {
    title: 'Agencies',
    _path: '/partners/agencies'
  },
  {
    title: 'Sponsors',
    _path: '/partners/sponsors'
  },
  {
    title: 'Jobs',
    _path: '/partners/jobs'
  }
])
</script>
