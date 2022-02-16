<template>
  <div class="space-y-6">
    <UCard body-class>
      <template #header>
        <div class="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
          <div class="ml-4 mt-4">
            <h2 class="text-lg leading-6 font-medium u-text-gray-900">
              Login Connections
            </h2>
            <p class="mt-1 text-sm u-text-gray-500">
              Connect your Personal Account on Nuxt with a third-party service to use it for login.
            </p>
          </div>
        </div>
      </template>

      <div class="px-4 py-5 sm:px-6">
        No login connections yet.
      </div>
    </UCard>

    <UCard v-if="user.provider === 'github'" body-class>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-6">
            <UIcon name="fa-brands:github" class="w-10 h-10" />
            <div>
              <p class="text-lg font-medium leading-5 text-u-gray-900">
                GitHub
              </p>
              <p class="mt-1 text-u-gray-500">
                <a :href="`https://github.com/${user.username}`" class="font-medium text-primary-500 hover:underline" target="_blank">@{{ user.username }}</a>
              </p>
            </div>
          </div>

          <p class="text-sm text-u-gray-500">
            Connected {{ useTimeAgo(new Date(user.updatedAt)).value }}
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
</script>
