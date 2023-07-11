<template>
  <section>
    <SubNavbar title="Enterprise" :links="links" />
    <NuxtPage />
  </section>
</template>

<script setup lang="ts">
const links = ref([
  {
    title: 'Support',
    _path: '/enterprise/support'
  },
  {
    title: 'Agencies',
    _path: '/enterprise/agencies'
  },
  {
    title: 'Sponsors',
    _path: '/enterprise/sponsors'
  },
  {
    title: 'Jobs',
    _path: '/enterprise/jobs'
  },
  {
    title: 'Courses',
    _path: '/enterprise/courses'
  }
])
</script>
