<template>
  <section>
    <SubNavbar title="Support" :links="links" />
    <NuxtPage />
  </section>
</template>

<script setup lang="ts">
const links = ref([
  {
    title: 'Solutions',
    _path: '/support/solutions'
  },
  {
    title: 'Agencies',
    _path: '/support/agencies'
  },
  {
    title: 'Sponsors',
    _path: '/support/us'
  },
  {
    title: 'Jobs',
    _path: '/support/jobs'
  },
  {
    title: 'Workshop',
    _path: '/support/workshop'
  }
])
</script>
