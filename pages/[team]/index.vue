<template>
  <div>
    <Tabs />

    <Page>
      <div class="space-y-6">
        <div class="flex items-center flex-wrap-reverse px-4 gap-3 sm:px-0">
          <UInput
            v-model="q"
            name="q"
            placeholder="Search..."
            autocomplete="off"
            icon="heroicons-outline:search"
            class="w-full sm:w-auto sm:flex-1"
          />

          <UButton
            v-if="team"
            :to="`/${team.slug}/settings/members`"
            label="Add collaborators"
            icon="heroicons-outline:users"
            variant="secondary"
            class="w-full sm:w-auto"
          />
          <UButton
            v-else
            to="/teams/new"
            label="Create a team"
            icon="heroicons-outline:users"
            variant="secondary"
            class="w-full sm:w-auto"
          />

          <UButton :to="team ? `/${team.slug}/new` : '/dashboard/new'" label="New project" icon="heroicons-solid:plus" class="w-full sm:w-auto" />
        </div>

        <ProjectsList v-if="projects.length" :projects="filteredProjects" />
        <ProjectsListPlaceholder v-else />
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Team, Project } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const q = ref('')
const client = useStrapiClient()

const { data: projects } = await useAsyncData(`projects-${props.team?.slug || 'dashboard'}`, () => client<Project[]>(props.team ? `/teams/${props.team.slug}/projects` : '/projects'))

const filteredProjects = computed(() => {
  return projects.value.filter((project) => {
    return project.name.search(new RegExp(q.value, 'i')) !== -1
  })
})
</script>
