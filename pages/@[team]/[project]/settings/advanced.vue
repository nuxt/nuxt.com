<template>
  <div class="space-y-6">
    <UCard padded>
      <h2 class="text-lg font-medium leading-6 u-text-gray-900">
        Advanced
      </h2>
      <p class="mt-1 text-sm u-text-gray-400">
        Danger zone.
      </p>
      <div class="flex flex-col gap-6 mt-6">
        <UCard>
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
              <UButton label="Transfer project" size="sm" :disabled="!transferForm.destination" @click="onTransfer()" />
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
            <UButton variant="red" label="Delete project" size="sm" @click="onDelete()" />
          </div>
        </UCard>
      </div>
    </UCard>

    <UAlertDialog
      v-model="transferModal"
      icon="heroicons-outline:switch-horizontal"
      icon-class="text-gray-600"
      icon-wrapper-class="w-12 h-12 bg-gray-200 sm:h-10 sm:w-10"
      title="Transfer project"
      description="Are you sure you want to transfer this project?"
      @confirm="confirmTransfer()"
    />
    <UAlertDialog
      v-model="deleteModal"
      icon="heroicons-outline:x"
      icon-class="text-red-600"
      icon-wrapper-class="w-12 h-12 bg-red-100 sm:h-10 sm:w-10"
      title="Delete project"
      description="Are you sure you want to delete this project? This action is not reversible. Please be certain."
      @confirm="confirmDelete()"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref, PropType } from 'vue'
import { User, Project, Team } from '~/types'

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
const transferForm = ref({ destination: null })
const route = useRoute()
const router = useRouter()
const { $toast } = useNuxtApp()
const transferModal = ref(false)
const deleteModal = ref(false)
const transferring = ref(false)
const deleting = ref(false)

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

  if (route.params.team !== user.value.username && props.project.repository.owner === user.value.username) {
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

const onTransfer = () => {
  transferModal.value = true
}

const confirmTransfer = async () => {
  transferring.value = true

  try {
    await client(`/projects/${props.project.id}/transfer`, {
      method: 'POST',
      body: {
        destination: transferForm.value.destination
      }
    })

    const team = transferForm.value.destination === user.value.username
      ? user.value.username
      // eslint-disable-next-line eqeqeq
      : teams.value.filter(team => transferForm.value.destination == team.value)[0].slug

    router.replace({ name: '@team-projects', params: { team } })

    $toast.success({
      title: 'Success',
      description: 'Your project has been transferred!'
    })
  } catch (e) {}

  transferring.value = false
}

const onDelete = () => {
  deleteModal.value = true
}

const confirmDelete = async () => {
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
