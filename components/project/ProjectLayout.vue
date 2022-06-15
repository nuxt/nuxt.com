<template>
  <div class="flex h-screen">
    <ProjectAside class="hidden lg:flex" :links="linksWithoutLabel" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <ProjectNavbar :links="links" class="lg:hidden" />

      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Ref } from 'vue'
import { omit } from 'lodash-es'
import type { Project } from '~/types'

const project: Ref<Project> = inject('project')

const { isDraft: isContentDraft } = useProjectFiles(project.value, 'content')
const { isDraft: isMediaDraft } = useProjectFiles(project.value, 'public')

const links = computed(() => ([
  { to: { name: '@team-project-content' }, icon: 'heroicons-outline:pencil', label: 'Content', badge: isContentDraft.value },
  { to: { name: '@team-project-media' }, icon: 'heroicons-outline:photograph', label: 'Media', badge: isMediaDraft.value },
  { to: { name: '@team-project-settings' }, icon: 'heroicons-outline:cog', label: 'Settings' }
]))

const linksWithoutLabel = computed(() => links.value.map(link => omit(link, 'label')))
</script>
