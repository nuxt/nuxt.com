<template>
  <Page>
    <div class="flex items-center justify-end">
      <UButton :to="team ? `/${team.slug}/new` : '/dashboard/new'" label="New project" icon="heroicons-solid:plus" />
    </div>
  </Page>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})
</script>
