<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium leading-6 u-text-gray-900">
          General
        </h2>
        <p class="mt-1 text-sm u-text-gray-400">
          Update your team informations.
        </p>
      </template>

      <div class="space-y-6">
        <UFormGroup name="slug" label="Slug" :help="form.slug !== slug ? `Your team slug will be renamed to “${slug}”` : 'This is your team\'s URL namespace on Nuxt.'" required class="relative">
          <div class="flex items-center">
            <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
              nuxt.com/
            </span>

            <UInput
              v-model="form.slug"
              name="slug"
              required
              autocomplete="off"
              class="w-full lg:w-56"
              placeholder="choam"
              custom-class="rounded-l-none"
            />
          </div>
        </UFormGroup>

        <UFormGroup name="name" label="Name" help="This is your team's visible name within Nuxt. For example, the name of your company or department." required>
          <UInput
            v-model="form.name"
            name="name"
            required
            placeholder="CHOAM"
            autocomplete="off"
            class="w-full lg:w-80"
          />
        </UFormGroup>

        <UFormGroup name="avatar" label="Avatar" help="An avatar is optional but strongly recommended.">
          <div class="flex items-center gap-3">
            <UAvatar :src="avatar" gradient />

            <input ref="file" name="avatar" type="file" class="hidden" @change="onFileUpload">

            <UButton label="Change" size="sm" variant="secondary" @click="$refs.file.click()" />
          </div>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex items-center justify-end">
          <UButton
            type="submit"
            :loading="loading"
            label="Save"
            @click="onSubmit()"
          />
        </div>
      </template>
    </UCard>
    <UCard>
      <div :class="{ 'opacity-50 cursor-not-allowed': !isOwner }">
        <h2 class="text-lg font-medium leading-6 u-text-gray-900">
          Leave team
        </h2>
        <p class="mt-1 text-sm u-text-gray-400">
          Revoke your access to this team. Any resources you've added to the Team will remain.
        </p>
      </div>
      <template #footer>
        <div class="flex items-center" :class="{ 'justify-end': isOwner }">
          <UButton
            v-if="isOwner"
            :loading="loading"
            variant="red"
            label="Leave team"
            @click="onLeave()"
          />
          <p v-else class="text-sm py-2.5 -my-px">
            To leave this team, ensure at least one more member has the Owner role.
          </p>
        </div>
      </template>
    </UCard>
    <UCard>
      <div :class="{ 'opacity-50 cursor-not-allowed': !isOwner }">
        <h2 class="text-lg font-medium leading-6 u-text-gray-900">
          Delete team
        </h2>
        <p class="mt-1 text-sm u-text-gray-400">
          Permanently remove your team and all of its contents from Docus. This action is not reversible – please continue with caution.
        </p>
      </div>
      <template #footer>
        <div class="flex items-center" :class="{ 'justify-end': isOwner }">
          <UButton
            v-if="isOwner"
            :loading="loading"
            variant="red"
            label="Delete team"
            @click="onDelete()"
          />
          <p v-else class="text-sm py-2.5 -my-px">
            You need to be an Owner of this team in order to delete it.
          </p>
        </div>
      </template>
    </UCard>
    <UAlertDialog
      v-model="leaveModal"
      icon="heroicons-outline:x"
      icon-class="bg-red-600"
      icon-wrapper-class="w-12 h-12 bg-red-100 sm:h-10 sm:w-10"
      title="Leave team"
      description="Are you sure you want to leave the team?"
      @confirm="confirmLeave()"
    />
    <UAlertDialog
      v-model="deleteModal"
      icon="heroicons-outline:x"
      icon-class="bg-red-600"
      icon-wrapper-class="w-12 h-12 bg-red-100 sm:h-10 sm:w-10"
      title="Delete team"
      description="Are you sure you want to delete the team? This action cannot be undone!"
      @confirm="confirmDelete()"
    />
  </div>
</template>

<script setup lang="ts">
import { omit } from 'lodash-es'
import slugify from '@sindresorhus/slugify'
import type { PropType, Ref } from 'vue'
import type { Team, User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const router = useRouter()
const client = useStrapiClient()
const user = useStrapiUser() as Ref<User>
const avatar = ref(props.team.avatar?.url)
const file = ref(null)
const form = reactive({ name: props.team.name, slug: props.team.slug, avatar: '' })
const loading = ref(false)
const { $toast } = useNuxtApp()
const leaveModal = ref(false)
const deleteModal = ref(false)

const updateUserTeam = (updatedTeam) => {
  const { team } = user.value?.memberships?.find(membership => membership.team.id === updatedTeam.id) || {}
  if (team) {
    Object.assign(team, updatedTeam)
  }
}

const removeTeamFromUser = () => {
  const index = user.value?.memberships?.findIndex(m => m.team.id === props.team.id) || -1
  if (index > -1) {
    user.value.memberships.splice(index, 1)
  }
}

const onSubmit = async () => {
  loading.value = true

  try {
    const formData = new FormData()
    if (form.avatar) { formData.append('files.avatar', form.avatar) }
    formData.append('data', JSON.stringify(omit(form, ['avatar'])))

    const team = await client<Team>(`/teams/${props.team.id}`, {
      method: 'PUT',
      body: formData
    })

    updateUserTeam(team)

    if (team.slug !== props.team.slug) {
      // Replace `name` param in url
      router.replace(`/${team.slug}/settings`)
    }

    $toast.success({
      title: 'Success',
      description: 'Your team settings have been saved.'
    })
  } catch (e) {}

  loading.value = false
}

const onLeave = () => {
  leaveModal.value = true
}

const confirmLeave = async () => {
  try {
    await client(`/teams/${props.team.id}/members/${user.value.id}`, {
      method: 'DELETE'
    })

    removeTeamFromUser()

    router.push('/dashboard')
  } catch (e) {}
}

const onDelete = () => {
  deleteModal.value = true
}

const confirmDelete = async () => {
  try {
    await client(`/teams/${props.team.id}`, {
      method: 'DELETE'
    })

    removeTeamFromUser()

    router.push('/dashboard')
  } catch (e) {}
}

const onFileUpload = () => {
  form.avatar = file.value.files[0]

  avatar.value = URL.createObjectURL(form.avatar)
}

const slug = computed(() => {
  return slugify(form.slug)
})

const isOwner = computed(() => {
  const member = props.team?.members?.find(member => member.user.id === user.value.id)

  return member?.role === 'owner'
})
</script>
