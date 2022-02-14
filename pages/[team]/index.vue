<template>
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
        <UButton :to="team ? `/${team.slug}/new` : '/dashboard/new'" label="New project" icon="heroicons-solid:plus" />
      </div>
      <UCard body-class="flex flex-col items-center p-12 space-y-4 text-center">
        <ProjectsListPlaceholder v-if="!filteredProjects.length" />
        <ProjectsList v-else :projects="projects" />
      </UCard>
    </div>
  </Page>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Template, Project, User } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const q = ref('')
const user = useStrapiUser()
const projects = [
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 85, name: 'MyFirstTemplateProject', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team }
] as Project[]
// TODO: uncomment when api ready
// const route = useRoute()
// const user = useStrapiUser() as Ref<User>
// const { find } = useStrapi4()

// const teamSlug = route.params.team && route.params.team !== 'dashboard' && route.params.team !== user.value.username ? route.params.team : undefined
// const { data: projects } = await useAsyncData('projects', () => find<Project[]>('projects', omitBy({ team: teamSlug }, isUndefined)))

const filteredProjects = computed(() => {
  return projects.filter((project) => {
    return project.name.search(new RegExp(q.value, 'i')) !== -1
  })
})
</script>
