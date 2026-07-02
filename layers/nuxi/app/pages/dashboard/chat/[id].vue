<script setup lang="ts">
import { resolveChatRouteId, useChatRouteId } from '../../../composables/useChatRouteId'

definePageMeta({
  layout: 'dashboard',
  key: route => resolveChatRouteId(route.path, route.params.id) || route.path
})

const chatId = useChatRouteId()
</script>

<template>
  <AgentChatPage v-if="chatId" :key="chatId" :chat-id="chatId" />
</template>
