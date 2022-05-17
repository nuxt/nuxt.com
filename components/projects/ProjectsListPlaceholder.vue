<template>
  <UCard body-class="p-12 text-center">
    <h2 class="text-2xl font-semibold u-text-gray-900">
      No projects yet!
    </h2>
    <p class="mt-3 u-text-gray-500">
      Create a project from a template, or import a git repository.
    </p>
    <div class="grid mx-auto my-10 sm:mx-0 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <TemplatesItem
        v-for="(template, index) of templates"
        :key="index"
        :template="template"
        :to="{ name: '@team-new-clone', params: { team: team?.slug || user.username }, query: { template: template.slug } }"
      />
    </div>

    <UButton :to="{ name: '@team-new', params: { team: team?.slug || user.username } }" label="Create a new project" size="lg" />
    <div class="mt-3">
      <NuxtLink :to="{ name: 'templates' }" class="text-sm u-text-gray-900 hover:underline">
        Browse templates &rarr;
      </NuxtLink>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User, Team, Template } from '~/types'

const team: Team = inject('team')
const user = useStrapiUser() as Ref<User>

const { find } = useStrapi4()

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: 'screenshot', pagination: { start: 0, limit: 4 } }))
</script>
