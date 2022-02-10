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
        <div class="grid grid-cols-1 gap-6 my-8 sm:grid-cols-2 lg:grid-cols-4">
          <UCard v-for="(template) in templates" :key="template.title" class="my-4 rounded-md" body-class="border-gray-500 rounded-md h-60 lg:h-48">
            <img src="https://nuxtjs.org/design-kit/white-text.svg" alt="nuxtjs" class="object-contain w-full bg-gray-900 h-3/4">
            <div class="flex items-center pl-2 text-left h-1/4">
              {{ template.title }}
            </div>
          </UCard>
        </div>
        <UButton to="/projects/new/" label="Create a New project" size="lg" />
        <ULink to="" class="text-sm u-text-gray-900 hover:underline">
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

// populate doesn't work
// const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: ['screenshot'] }))

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: ['screenshot'] }))
</script>
