<template>
  <div>
    <PageHeader
      title="Let's build something new."
      description="Get started with one of our templates:"
    />

    <Page overlap>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
        <TemplateCard
          v-for="(template, index) of templates"
          :key="index"
          :template="template"
          :to="{ name: 'team-new-clone', query: { template: template.slug } }"
        />
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Template } from '~/types'

defineProps({
  templates: {
    type: Array as PropType<Template[]>,
    default: () => []
  }
})
</script>
