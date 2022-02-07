<template>
  <div>
    <div class="space-y-6">
      <UCard body-class>
        <template #header>
          <div class="flex flex-wrap items-center justify-between -mt-4 -ml-4 sm:flex-nowrap">
            <div class="mt-4 ml-4">
              <h2 class="text-lg font-medium leading-6 u-text-gray-900">
                Members
              </h2>
              <p class="mt-1 text-sm u-text-gray-500">
                Manage and invite team members.
              </p>
            </div>
            <div class="flex-shrink-0 mt-4 ml-4">
              <UButton
                v-if="isOwner"
                label="Invite"
                icon="heroicons-outline:plus"
                size="sm"
                trailing
                @click="inviteModal = true"
              />
            </div>
          </div>
        </template>

        <ul role="list" class="divide-y u-divide-gray-200">
          <li v-for="member of members" :key="member.id" class="flex items-center justify-between gap-3 px-4 py-5 sm:px-6">
            <div class="flex items-center gap-3">
              <UAvatar :src="member.user.avatar" :alt="member.user.username" />
              <div>
                <p class="text-sm font-medium u-text-gray-900">
                  {{ member.user.name }}
                </p>
                <p class="text-sm u-text-gray-500">
                  {{ member.user.email }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <USelect
                v-if="isOwner && member.id !== user.id"
                name="role"
                :model-value="member.role"
                size="sm"
                :options="roles"
                @update:model-value="onMemberRoleChange(member, $event)"
              />
              <p v-else class="text-sm capitalize u-text-gray-500">
                {{ member.role }}
              </p>

              <UDropdown
                :disabled="!isOwner && member.id !== user.id"
                class="-mr-2"
                placement="bottom-start"
                :items="[[{
                  slot: 'leave-team',
                  label: member.id !== user.id ? 'Remove from team' : 'Leave team',
                  icon: member.id !== user.id ? 'heroicons-outline:x' : 'heroicons-outline:exclamation',
                  class: '!text-red-500',
                  click: () => onMemberRemove(member)
                }]]"
              >
                <UButton icon="heroicons-outline:dots-vertical" variant="transparent" />

                <template #leave-team="{ item }">
                  <UIcon :name="item.icon" :class="[itemIconClass, '!text-red-500']" />

                  {{ item.label }}
                </template>
              </UDropdown>
            </div>
          </li>
        </ul>
      </UCard>
    </div>

    <UModal v-model="inviteModal">
      <template #header>
        <h2 class="font-medium sm:text-lg sm:leading-6 text-tw-gray-900">
          Invite members to your team
        </h2>
      </template>

      <div class="text-center">
        <p class="mb-3 u-text-gray-500">
          Allow other people to join your team through the link below:
        </p>

        <UInput name="link" :model-value="inviteLink" disabled class="flex items-center mx-8 mb-6" custom-class="truncate pr-9 dark:disabled:bg-gray-900">
          <UButton icon="heroicons-outline:clipboard-copy" variant="transparent" class="absolute right-0" @click="onCopyInviteLink" />
        </UInput>

        <UButton label="Reset link" :loading="reseting" @click="onResetCode" />
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import type { Team, User } from '~/types'

import ui from '#build/ui'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const roles = [{
  text: 'Owner',
  value: 'owner'
}, {
  text: 'Member',
  value: 'member'
}]

const itemIconClass = ui.dropdown.item.icon

const { $clipboard, $toast } = useNuxtApp()
const config = useRuntimeConfig()
const router = useRouter()
const user = useStrapiUser() as Ref<User>
const client = useStrapiClient()

const reseting = ref(false)
const inviteModal = ref(false)

const members = computed(() => props.team.members || [])

const onCopyInviteLink = () => {
  $clipboard.copy(inviteLink.value, { title: 'Invite link successfully copied!' })
}

const removeTeamFromUser = (team) => {
  const index = user.value?.memberships?.findIndex(m => m.team.id === team.id) || -1
  if (index > -1) {
    user.value.memberships.splice(index, 1)
  }
}

const removeMemberFromTeam = (member) => {
  const index = props.team.members?.findIndex(m => m.id === member.id) || -1
  if (index > -1) {
    // eslint-disable-next-line vue/no-mutating-props
    props.team.members?.splice(index, 1)
  }
}

const onMemberRoleChange = async (member, role) => {
  try {
    await client(`/teams/${props.team.id}/members/${member.id}`, {
      method: 'PUT',
      body: {
        role
      }
    })

    member.role = role
  } catch (e) {}
}

const onMemberRemove = async (member) => {
  const isMyself = member.id === user.value.id

  if (!confirm(isMyself ? 'Are you sure you want to leave the team?' : 'Are you sure you want to remove this member?')) {
    return
  }

  try {
    await client(`/teams/${props.team.id}/members/${member.id}`, {
      method: 'DELETE'
    })

    if (isMyself) {
      removeTeamFromUser(props.team)
      router.push('/dashboard')
    } else {
      removeMemberFromTeam(member)
    }
  } catch (e) {}
}

const onResetCode = async () => {
  reseting.value = true

  try {
    const { code } = await client(`/teams/${props.team.id}/code`, {
      method: 'POST'
    })

    Object.assign(props.team, { code })

    $toast.success({
      title: 'You invite link has been resetted!'
    })
  } catch (e) {}

  reseting.value = false
}

const inviteLink = computed(() => {
  return `${config.baseUrl}/teams/invite?code=${props.team.code}`
})

const isOwner = computed(() => {
  const teamUser = props.team.members.find(member => member.id === user.value.id)

  return teamUser?.role === 'owner'
})
</script>
