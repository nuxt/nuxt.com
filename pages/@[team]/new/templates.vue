<template>
  <div>
    <PageHeader title="Select a template." description="We support all your favorite frameworks without additional configuration." />

    <Page overlap>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
        <TemplatesItem
          v-for="(template, index) of templates"
          :key="index"
          :template="template"
          :to="{ name: '@team-new-clone', query: { template: template.slug } }"
        />
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Template } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  templates: {
    type: Array as PropType<Template[]>,
    default: () => []
  }
})
</script>
