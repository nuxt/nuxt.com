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
        <UFormGroup name="name" label="Name" :help="form.name !== nameSlugified ? `Your project name will be renamed to “${nameSlugified}”` : 'This is your project\'s URL namespace on Nuxt.'" required class="relative">
          <div class="flex items-center">
            <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
              nuxt.com/@{{ team?.slug || user.username }}/
            </span>

            <UInput
              v-model="form.name"
              name="name"
              required
              autocomplete="off"
              class="w-full lg:w-56"
              placeholder="choam"
              custom-class="rounded-l-none"
            />
          </div>
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
const client = useStrapiClient()
const { $toast } = useNuxtApp()

const form = reactive({ name: props.project.name })
const updating = ref(false)

const onSubmit = async () => {
  updating.value = true

  try {
    const project = await client<Project>(props.team ? `/teams/${props.team.slug}/projects/${props.project.name}` : `/projects/${props.project.name}`, {
      method: 'PUT',
      body: form
    })

    if (project.name !== props.project.name) {
      // Replace `name` param in url
      router.replace({ name: '@team-project-settings', params: { team: props.team.slug, project: project.name } })
    }

    $toast.success({
      title: 'Success',
      description: 'Your project settings have been saved.'
    })
  } catch (e) {}

  updating.value = false
}

const nameSlugified = computed(() => {
  return slugify(form.name)
})
</script>
