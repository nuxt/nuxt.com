<template>
  <div>
    <Tabs />

    <Page>
      <div class="space-y-6">
        <div class="flex px-4 mx-auto space-x-4 sm:px-0">
          <UInput
            v-model="q"
            name="q"
            type="search"
            placeholder="Search..."
            autocomplete="off"
            icon="heroicons-outline:search"
            class="flex-1"
          />

          <UButton v-if="team" :to="`/${team.slug}/settings/members`" label="Add collaborators" icon="heroicons-outline:users" variant="secondary" />
          <UButton v-else to="/teams/new" label="Create a team" icon="heroicons-outline:users" variant="secondary" />

          <UButton :to="team ? `/${team.slug}/new` : '/dashboard/new'" label="New project" icon="heroicons-solid:plus" />
        </div>
        <UCard body-class="flex flex-col items-center p-12 space-y-4 text-center">
          <ProjectsListPlaceholder v-if="!filteredProjects.length" />
          <div v-else>
            {{ filteredProjects }}
          </div>
        </UCard>
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Template, Project, User } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const q = ref('')
const projects = ref([
  { id: 85, name: 'my-first-template-project', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, url: 'https://my-first-template-project-flosciante.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'my-first-template-project-flosciante', rootDir: '.' },
  { id: 86, name: 'my-second-template-project', repository: { id: 99, owner: 'Flosciante', name: 'MySecondTemplateProject', description: null, language: null }, url: 'https://my-second-template-project-flosciante.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'my-second-template-project-flosciante', rootDir: '.' },
  { id: 87, name: 'my-project', repository: { id: 99, owner: 'Flosciante', name: 'MyProject', description: null, language: null }, url: 'https://my-project-flosciante.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'my-project-flosciante', rootDir: '.' },
  { id: 88, name: 'project', repository: { id: 99, owner: 'Flosciante', name: 'Project', description: null, language: null }, url: 'https://project-flosciante.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'project-flosciante', rootDir: '.' },
  { id: 89, name: 'template-project', repository: { id: 99, owner: 'Flosciante', name: 'TemplateProject', description: null, language: null }, url: 'https://template-project.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'template-project-flosciante', rootDir: '.' },
  { id: 90, name: 'my', repository: { id: 99, owner: 'Flosciante', name: 'My', description: null, language: null }, url: 'https://my.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'my-flosciante', rootDir: '.' },
  { id: 91, name: 'my-third-template-project', repository: { id: 99, owner: 'Flosciante', name: 'MyThirdTemplateProject', description: null, language: null }, url: 'https://my-third-template-project-flosciante.docus.site', status: 'error', screenshotUrl: null, screenshot: null, user: null, localhostUrl: 'http://localhost:3000', externallyHosted: null, worker: 'my-third-template-project-flosciante', rootDir: '.' }
])
// TODO: uncomment when api ready
// const route = useRoute()
// const user = useStrapiUser() as Ref<User>
// const { find } = useStrapi4()

// const teamSlug = route.params.team && route.params.team !== 'dashboard' && route.params.team !== user.value.username ? route.params.team : undefined
// const { data: projects } = await useAsyncData('projects', () => find<Project[]>('projects', omitBy({ team: teamSlug }, isUndefined)))

const filteredProjects = computed(() => {
  return projects.value.filter((project) => {
    return project.name.search(new RegExp(q.value, 'i')) !== -1
  })
})
</script>
