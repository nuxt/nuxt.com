<template>
  <div class="space-y-6">
    <UCard v-if="transferOptions && transferOptions.length">
      <h2 class="text-lg font-medium leading-6 u-text-gray-900">
        Transfer project
      </h2>
      <p class="mt-1 text-sm u-text-gray-400">
        Your project and all of its dependencies will be transferred without downtime or workflow interruptions to the selected destination.
      </p>
      <div class="flex flex-col justify-between gap-4 mt-5 sm:flex-row">
        <USelect
          v-model="transferForm.destination"
          size="sm"
          icon="heroicons-outline:switch-horizontal"
          placeholder="Select a destination"
          :options="transferOptions"
          name="destination"
        />
        <div class="flex justify-end">
          <UButton label="Transfer project" size="sm" :disabled="!transferForm.destination" @click="transferModal = true" />
        </div>
      </div>
    </UCard>
    <UCard>
      <h2 class="text-lg font-medium leading-6 u-text-gray-900">
        Delete project
      </h2>
      <p class="mt-1 text-sm u-text-gray-400">
        Your project and all of its dependencies will be transferred without downtime or workflow interruptions to the selected destination.
      </p>
      <div class="flex justify-end mt-5">
        <UButton variant="red" label="Delete project" size="sm" @click="deleteModal = true" />
      </div>
    </UCard>

    <ProjectSettingsTransferModal v-model="transferModal" @submit="transferProject" />
    <ProjectSettingsDeleteModal v-model="deleteModal" @submit="deleteProject" />
  </div>
</template>

<script setup lang="ts">
import type { Ref, PropType } from 'vue'
import type { User, Project, Team } from '~/types'

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

const client = useStrapiClient()
const { delete: _delete } = useStrapi4()
const user = useStrapiUser() as Ref<User>
const router = useRouter()
const { $toast } = useNuxtApp()

const transferForm = reactive({ destination: null })
const transferModal = ref(false)
const deleteModal = ref(false)
const transferring = ref(false)
const deleting = ref(false)

// Computed

const teams = computed(() => {
  return user.value.memberships
    .filter(membership => props.team?.id !== membership.team.id)
    .map(membership => ({
      text: membership.team.name,
      value: membership.team.id,
      slug: membership.team.slug
    }))
})

const transferOptions = computed(() => {
  const options = []

  if (props.team) {
    options.push({
      text: 'Personal account',
      children: [
        {
          text: user.value.username,
          value: user.value.username
        }
      ]
    })
  }

  if (teams.value.length) {
    options.push({
      text: 'Teams',
      children: teams.value
    })
  }

  return options
})

// Http

const transferProject = async () => {
  transferring.value = true

  try {
    await client(`/projects/${props.project.id}/transfer`, {
      method: 'POST',
      body: {
        destination: transferForm.destination
      }
    })

    const team = transferForm.destination === user.value.username
      ? user.value.username
      // eslint-disable-next-line
      : teams.value.filter(team => transferForm.destination == team.value)[0].slug

    router.replace({ name: '@team-projects', params: { team } })

    $toast.success({
      title: 'Success',
      description: 'Your project has been transferred!'
    })
  } catch (e) {}

  transferring.value = false
}

const deleteProject = async () => {
  deleting.value = true

  try {
    await _delete<Project>('projects', props.project.id)

    const team = props.team ? props.team.slug : user.value.username

    router.push({ name: '@team-projects', params: { team } })

    $toast.success({
      title: 'Success',
      description: 'Your project has been deleted!'
    })
  } catch (e) {}

  deleting.value = false
}
</script>
