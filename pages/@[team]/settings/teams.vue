<template>
  <div class="space-y-6">
    <UCard body-class>
      <template #header>
        <div class="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
          <div class="ml-4 mt-4">
            <h2 class="text-lg leading-6 font-medium u-text-gray-900">
              Teams
            </h2>
            <p class="mt-1 text-sm u-text-gray-500">
              Manage the teams that you're a part of, or create a new one.
            </p>
          </div>
          <div class="ml-4 mt-4 flex-shrink-0">
            <UButton
              label="Create a team"
              :to="{ name: 'teams-new' }"
              icon="heroicons-solid:plus"
              size="sm"
              trailing
            />
          </div>
        </div>
      </template>

      <ul v-if="teams && teams.length" role="list" class="divide-y u-divide-gray-200">
        <li v-for="team of teams" :key="team.id" class="px-4 py-5 sm:px-6 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <UAvatar :src="team.avatar ? team.avatar.url : null" :alt="team.name" gradient />
            <div>
              <p class="text-sm font-medium u-text-gray-900">
                {{ team.name }}
              </p>
              <p class="text-sm u-text-gray-500 capitalize">
                {{ team.role }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UButton label="View" :to="{ name: '@team', params: { team: team.slug } }" variant="secondary" size="sm" />
            <UButton label="Manage" :to="{ name: '@team-settings', params: { team: team.slug } }" variant="secondary" size="sm" />

            <UDropdown
              placement="bottom-start"
              class="-mr-2"
              :items="[[{
                label: 'Copy invite link',
                icon: 'heroicons-outline:clipboard-copy',
                click: () => onCopyInviteLink(team)
              }], [{
                slot: 'leave-team',
                label: 'Leave team',
                icon: 'heroicons-outline:exclamation',
                class: '!text-red-500',
                click: () => onLeave(team)
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

    <UAlertDialog
      v-model="leaveModal"
      icon="heroicons-outline:x"
      icon-class="text-red-600"
      icon-wrapper-class="h-12 w-12 sm:h-10 sm:w-10 bg-red-100"
      title="Leave team"
      description="Are you sure you want to leave the team?"
      @confirm="confirmLeave"
      @cancel="leavingTeam = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'
import ui from '#build/ui'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const { $clipboard } = useNuxtApp()
const config = useRuntimeConfig()
const user = useStrapiUser() as Ref<User>
const client = useStrapiClient()
const router = useRouter()

if (props.team) {
  router.replace({ name: '@team-settings', params: { team: props.team.slug } })
}

const itemIconClass = ui.dropdown.item.icon

const teams = computed(() => user.value.memberships.map(m => ({ role: m.role, ...m.team })))
const leaveModal = ref(false)
const leavingTeam = ref(null)

const onCopyInviteLink = (team) => {
  $clipboard.copy(`${config.baseUrl}/teams/invite?code=${team.code}`, { title: 'Invite link successfully copied!' })
}

const removeTeamFromUser = (team) => {
  const index = user.value?.memberships?.findIndex(m => m.team.id === team.id)
  if (index > -1) {
    user.value.memberships.splice(index, 1)
  }
}

const onLeave = (team) => {
  leavingTeam.value = team
  leaveModal.value = true
}

const confirmLeave = async () => {
  try {
    await client(`/teams/${leavingTeam.value.id}/members/${user.value.id}`, {
      method: 'DELETE'
    })

    removeTeamFromUser(leavingTeam.value)

    leavingTeam.value = null
  } catch (e) {}
}
</script>
