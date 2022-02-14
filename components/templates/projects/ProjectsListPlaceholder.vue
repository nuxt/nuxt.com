<template>
  <div>
    <h2 class="text-2xl font-semibold leading-6 u-text-gray-900">
      No projects yet!
    </h2>
    <p class="u-text-gray-500">
      Create a project from a Template, or import a Git repository.
    </p>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <TemplateCard
        v-for="(template, index) of templates.slice(0, 4)"
        :key="index"
        class="my-4"
        :template="template"
        :to="{ name: 'team-new-clone', query: { template: template.slug } }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from '~/types'
const { find } = useStrapi4()

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: ['screenshot'] }))
</script>
