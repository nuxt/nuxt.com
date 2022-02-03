<template>
  <div class="space-y-6">
    <UCard
      variant="black"
      ring-class="ring-1 u-ring-gray-200"
      wrapper-class
      body-class
      border-color-class="u-border-gray-200"
    >
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
              to="/teams/new"
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
              <!-- <p class="text-sm u-text-gray-500 capitalize">
                {{ team.permission }}
              </p> -->
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UButton label="View" :to="`/${team.slug}`" variant="white" size="sm" />
            <UButton label="Manage" :to="`/${team.slug}/settings`" variant="white" size="sm" />

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
                click: () => onLeave()
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
      icon-class="bg-red-600"
      icon-wrapper-class="h-12 w-12 sm:h-10 sm:w-10 bg-red-100"
      title="Leave team"
      description="Are you sure you want to leave the team?"
      @confirm="confirmLeave"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Team, User } from '~/types'

import ui from '#build/ui'

const { $clipboard } = useNuxtApp()
const config = useRuntimeConfig()
const user = useStrapiUser() as Ref<User>

const itemIconClass = ui.dropdown.item.icon

const teams: Ref<Team[]> = ref(user.value.teams)
const leaveModal = ref(false)

const onCopyInviteLink = (team) => {
  $clipboard.copy(`${config.baseUrl}/teams/invite?code=${team.code}`, { title: 'Invite link successfully copied!' })
}

const removeTeamFromUser = (team) => {
  const index = user.value?.teams?.findIndex(t => t.id === team.id)
  if (index > -1) {
    user.value?.teams?.splice(index, 1)
  }
}

const onLeave = () => {
  leaveModal.value = true
}

const confirmLeave = (team) => {
  try {
    // TODO
    // await $strapi.$http.$delete(`/teams/${team.id}/members/${$strapi.user.id}`)

    // removeTeamFromUser(team)
  } catch (e) {}
}
</script>
