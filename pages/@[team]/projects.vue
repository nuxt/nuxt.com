<template>
  <TeamPage>
    <div class="space-y-6">
      <div class="flex flex-wrap-reverse items-center gap-3 px-4 sm:px-0">
        <UInput
          v-model="q"
          name="q"
          placeholder="Search..."
          autocomplete="off"
          appearance="darken"
          icon="heroicons-outline:search"
          class="w-full sm:w-auto sm:flex-1"
        />

        <UButton
          v-if="team"
          :to="{ name: '@team-settings-members', params: { team: team?.slug || user.username } }"
          label="Add collaborators"
          icon="heroicons-outline:users"
          variant="secondary"
          class="w-full sm:w-auto"
        />
        <UButton
          v-else
          :to="{ name: 'teams-new' }"
          label="Create a team"
          icon="heroicons-outline:users"
          variant="secondary"
          class="w-full sm:w-auto"
        />

        <UButton :to="{ name: '@team-new', params: { team: team?.slug || user.username } }" label="New project" icon="heroicons-solid:plus" class="w-full sm:w-auto" />
      </div>

      <ProjectsList v-if="projects && projects.length" :projects="filteredProjects" />
      <ProjectsListPlaceholder v-else />
    </div>
  </TeamPage>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const user = useStrapiUser() as Ref<User>
const client = useStrapiClient()
const q = ref('')

provide('team', props.team)

const { data: projects } = await useAsyncData(
  `projects-${props.team?.slug || user.value.username}`,
  () => client<Project[]>(props.team ? `/teams/${props.team.slug}/projects` : '/projects'),
  { initialCache: false }
)

const filteredProjects = computed(() => {
  return projects.value.filter((project) => {
    return project.name.search(new RegExp(q.value, 'i')) !== -1
  })
})
</script>
