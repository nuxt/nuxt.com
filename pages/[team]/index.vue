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
      <UCard body-class="flex flex-col items-center space-y-4 text-center" :class="{ 'p-12': !filteredProjects.length } ">
        <ProjectsListPlaceholder v-if="!filteredProjects.length" />
        <ProjectsList v-else :projects="filteredProjects" />
      </UCard>
    </div>
  </Page>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, Project } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const q = ref('')
const user = useStrapiUser()

// TODO: Remove when api ready
// mock data
const projects = ref([
  { id: 85, name: 'Project 1', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'Project1', description: null, language: null }, template: null, url: 'https://project-1-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 86, name: 'Marketing project', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'MarketingProject', description: null, language: null }, template: null, url: 'https://marketing-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nuxtjs.png', alternativeText: 'nuxtjs.png', caption: 'nuxtjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/large_nextjs_commerce_cbd2f55b3a.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 87, name: 'Nuxt project', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'NuxtProject', description: null, language: null }, template: null, url: 'https://nuxt-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/large_nuxtjs_3c5d148dc4.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 88, name: 'UI Kit project', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'UiKitProject', description: null, language: null }, template: null, url: 'https://ui-kit-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/large_sveltekit_8896c870bd.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 89, name: 'React', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'React', description: null, language: null }, template: null, url: 'https://react-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/blitz_4755c42e5c.png', previewUrl: null }, user: user.value, team: props.team },
  { id: 90, name: 'MyFirstTemplateProject', updatedAt: '2022-02-10T15:53:59.782Z', repository: { id: 98, owner: 'Flosciante', name: 'MyFirstTemplateProject', description: null, language: null }, template: null, url: 'https://my-first-template-project-flosciante.docus.site', status: 'pending', screenshot: { name: 'nextjs.png', alternativeText: 'nextjs.png', caption: 'nextjs.png', ext: '.png', url: 'https://nuxt-dev.s3.fr-par.scw.cloud/nextjs_3fa2d40670.png', previewUrl: null }, user: user.value, team: props.team }
]) as Ref<Project[]>

// TODO: when api ready
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
