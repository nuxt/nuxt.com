<template>
  <ProjectPage>
    <template #header>
      <ProjectHeader />
    </template>

    <div class="flex flex-col flex-1 p-4 sm:p-6">
      <div class="lg:flex lg:items-center lg:justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 u-text-gray-900 sm:text-3xl sm:truncate">
            {{ project.name }}
          </h2>
          <div class="flex flex-col mt-1 sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div class="flex items-center mt-2 text-sm u-text-gray-500">
              <UIcon name="heroicons-outline:clock" class="flex-shrink-0 mr-1.5 h-5 w-5 u-text-gray-400" aria-hidden="true" />
              <time>
                Updated {{ useTimeAgo(new Date(project.updatedAt)).value }}
              </time>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-5 lg:mt-0 lg:ml-4">
          <UButton label="Edit" :to="{ name: '@team-project-content' }" icon="heroicons-outline:pencil" variant="secondary" />

          <UButton
            v-if="project.url"
            :to="project.url"
            target="_blank"
            label="View"
            icon="heroicons-outline:link"
            variant="secondary"
          />

          <UButton label="Open on GitHub" :to="`https://github.com/${project.repository.owner}/${project.repository.name}`" target="_blank" icon="fa-brands:github" />
        </div>
      </div>

      <UCard class="mt-8 flex-1 flex flex-col" body-class="flex-1 flex flex-col" padded>
        <iframe v-if="project.url" :src="project.url" class="w-full h-full" />
        <div v-else class="max-w-lg m-auto flex flex-col justify-center flex-1">
          <div class="text-center">
            <UIcon name="heroicons-outline:link" class="mx-auto h-12 w-12 u-text-gray-400" />
            <h2 class="mt-2 text-lg font-medium u-text-gray-900">
              Enter your project url
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              You haven't specified the url so we can display your project's preview. You can always update this url in your project settings.
            </p>
          </div>
          <form class="mt-6 flex items-center gap-3" @submit.prevent="onSubmit">
            <UInput v-model="form.url" name="url" type="url" placeholder="Enter an url" class="flex-1" />
            <UButton type="submit" :loading="loading" label="Save" />
          </form>
        </div>
      </Ucard>
    </div>
  </ProjectPage>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { PropType, Ref } from 'vue'
import type { Team, Project, User } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  }
})

const root = 'public'

provide('project', props.project)
provide('root', root)

const user = useStrapiUser() as Ref<User>
const { update } = useStrapi4()

const form = reactive({ url: props.project.repository.url })
const loading = ref(false)

async function onSubmit () {
  loading.value = true

  try {
    await update('projects', props.project.id, form)

    // eslint-disable-next-line vue/no-mutating-props
    props.project.url = form.url
  } catch (e) {}

  loading.value = false
}
</script>
