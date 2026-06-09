<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'admin'
})

useSeoMeta({
  title: 'Analytics',
  description: 'Feedback Analytics',
  ogTitle: 'Analytics',
  ogDescription: 'Feedback Analytics'
})
</script>

<template>
  <AdminAnalytics />
</template>
