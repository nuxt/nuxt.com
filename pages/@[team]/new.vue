<template>
  <div class="flex flex-col flex-1">
    <NuxtPage :team="team" :templates="templates" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Template } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const { find } = useStrapi4()

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: 'screenshot' }))
</script>
