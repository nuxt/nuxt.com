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
          <UCard v-for="(template) in templates.slice(0, 4)" :key="template.title" class="rounded-md lg:my-4" body-class="relative rounded-md h-60 lg:h-48 group">
            <img :src="template.screenshot.url" :alt="template.screenshot.alternativeText" class="object-cover w-full h-3/4">
            <div class="flex items-center px-2 text-left h-1/4">
              <span class="truncate">{{ template.title }}</span>
            </div>

            <div class="absolute inset-0 transition duration-300 transform rounded-md opacity-0 group-hover:block hover:backdrop-blur-sm hover:opacity-100 mix-blend-difference">
              <div class="flex items-center justify-center w-full h-full">
                <UIcon class="w-16 h-16 u-text-gray-400" name="heroicons-solid:arrow-circle-right" />
              </div>
            </div>
          </UCard>
        </div>
        <UButton to="/projects/new/" label="Create a New project" size="lg" />
        <ULink to="/new/templates" class="text-sm u-text-gray-900 hover:underline">
          Browse Templates &rarr;
        </ULink>
      </UCard>
      >>>>>>> 2fc41d6... feat: project placeholder (wip)
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
