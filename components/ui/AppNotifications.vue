<template>
  <div class="app-notifications">
    <div v-if="notifications.length">
      <div
        v-for="notification of notifications"
        :key="notification.id"
      >
        <AppNotification
          v-bind="notification"
          :class="notification.click && 'notification-cursor'"
          @click="notification.click && notification.click(notification)"
          @close="$toast.removeNotification(notification.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastNotification } from '../../types'
import { useNuxtApp, useState } from '#imports'

const { $toast } = useNuxtApp()
const notifications = useState<ToastNotification[]>('notifications', () => [])
</script>

<style lang="ts" scoped>
css({
  '.app-notifications': {
    position: 'fixed',
    bottom: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '{size.full}',
    zIndex: 55,

    '@sm': {
      width: '{size.sm}'
    },

    '> div': {
      px: '{size.4}',
      rowGap: '{size.12}',
      overflowY: 'auto',

      '@sm': {
        px: '{size.24}'
      }
    }
  },
  '.notification-cursor': {
    cursor: 'pointer'
  }
})

</style>
