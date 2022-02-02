<template>
  <UCard />
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})
</script>
