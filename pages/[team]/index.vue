<template>
  <Page>
    <div class="flex flex-col space-y-6">
      <div class="flex items-center justify-end">
        <UButton :to="team ? `/${team.slug}/new` : '/dashboard/new'" label="New project" icon="heroicons-solid:plus" />
      </div>
      <UCard body-class="flex flex-col items-center p-12 space-y-4 text-center">
        <h2 class="text-2xl font-semibold leading-6 u-text-gray-900">
          No projects, yet !
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
        <UButton to="/projects/new/" label="Create a New project" size="lg" />
        <ULink to="/new/templates" class="text-sm u-text-gray-900 hover:underline">
          Browse Templates &rarr;
        </ULink>
      </UCard>
    </div>
  </Page>
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
const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: ['screenshot'] }))

</script>
