<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-medium leading-6 u-text-gray-900">
          General
        </h2>
        <p class="mt-1 text-sm u-text-gray-500">
          View your account informations.
        </p>
      </template>

      <div class="space-y-6">
        <UFormGroup name="username" label="Username" help="This is your URL namespace within Nuxt." required class="relative">
          <div class="flex items-center">
            <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-text-gray-500">
              nuxt.com/
            </span>

            <UInput
              :model-value="user.username"
              name="username"
              required
              autocomplete="off"
              class="w-full lg:w-56"
              custom-class="rounded-l-none dark:disabled:!bg-black"
              disabled
            />
          </div>
        </UFormGroup>

        <UFormGroup name="name" label="Name" required>
          <UInput
            :model-value="user.name"
            name="name"
            required
            autocomplete="off"
            class="w-full lg:w-80"
            disabled
            custom-class="dark:disabled:!bg-black"
          />
        </UFormGroup>

        <UFormGroup name="email" label="Email" required>
          <UInput
            :model-value="user.email"
            name="email"
            required
            autocomplete="off"
            class="w-full lg:w-96"
            disabled
            custom-class="dark:disabled:!bg-black"
          />
        </UFormGroup>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
</script>
