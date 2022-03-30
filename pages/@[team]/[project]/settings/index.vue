<template>
  <div class="space-y-6">
    <UCard padded>
      <template #header>
        <h2 class="text-lg font-medium leading-6 u-text-gray-900">
          General
        </h2>
        <p class="mt-1 text-sm u-text-gray-400">
          Update your project informations.
        </p>
      </template>

      <div class="space-y-6">
        <UFormGroup name="slug" label="Slug" :help="form.slug !== slug ? `Your project slug will be renamed to “${slug}”` : 'This is your project\'s URL namespace on Nuxt.'" required class="relative w-full lg:max-w-md">
          <div class="flex items-center">
            <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
              nuxt.com/@{{ team?.slug || user.username }}/
            </span>

            <UInput
              v-model="form.slug"
              name="name"
              required
              autocomplete="off"
              class="w-full"
              placeholder="framework"
              custom-class="rounded-l-none"
            />
          </div>
        </UFormGroup>

        <UFormGroup name="name" label="Name" help="This is your project's visible name within Nuxt." required>
          <UInput
            v-model="form.name"
            name="name"
            required
            placeholder="Framework"
            autocomplete="off"
            class="w-full lg:max-w-xs"
          />
        </UFormGroup>

        <UFormGroup name="url" label="Url" help="The url of your project is used for preview purposes.">
          <UInput
            v-model="form.url"
            name="url"
            class="w-full lg:max-w-xs"
            placeholder="https://nuxtjs.org"
          />
        </UFormGroup>

        <UFormGroup name="baseDir" label="Base Directory" help="This is the path of your nuxt app in the repository.">
          <UInput
            v-model="form.baseDir"
            name="baseDir"
            class="w-full lg:max-w-xs"
            placeholder="docs/"
          />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-end">
          <UButton
            type="submit"
            :loading="updating"
            label="Save"
            @click="onSubmit()"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import slugify from '@sindresorhus/slugify'
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

const user = useStrapiUser() as Ref<User>
const router = useRouter()
const { update } = useStrapi4()
const { $toast } = useNuxtApp()

const form = reactive({ name: props.project.name, slug: props.project.slug, url: props.project.url, baseDir: props.project.baseDir })
const updating = ref(false)

const onSubmit = async () => {
  updating.value = true

  try {
    const project = await update<Project>('projects', props.project.id, form)

    if (project.slug !== props.project.slug) {
      // Replace `name` param in url
      router.replace({ name: '@team-project-settings', params: { team: props.team ? props.team.slug : user.value.username, project: project.slug } })
    }

    if (project.baseDir !== props.project.baseDir) {
      // reload files for both roots
      const { refresh: refreshContentFiles } = useProjectFiles(props.project, 'content')
      const { refresh: refreshMediaFiles } = useProjectFiles(props.project, 'public')
      refreshContentFiles()
      refreshMediaFiles()
    }

    Object.assign(props.project, project)

    $toast.success({
      title: 'Success',
      description: 'Your project settings have been saved.'
    })
  } catch (e) {}

  updating.value = false
}

const slug = computed(() => {
  return slugify(form.slug)
})
</script>
