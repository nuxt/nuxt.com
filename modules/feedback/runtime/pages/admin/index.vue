<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'feedback-auth'
})

useSeoMeta({
  title: 'Feedback Analytics Admin',
  description: 'Feedback Analytics Admin',
  ogTitle: 'Feedback Analytics Admin',
  ogDescription: 'Feedback Analytics Admin'
})
</script>

<template>
  <FeedbackDashboard />
</template>
