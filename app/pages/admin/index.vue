<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useSeoMeta({
  title: 'Feedback Analytics Admin',
  description: 'Feedback Analytics Admin',
  ogTitle: 'Feedback Analytics Admin',
  ogDescription: 'Feedback Analytics Admin'
})
</script>

<template>
  <AdminDashboard />
</template>
