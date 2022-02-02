<template>
  <nav class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <NuxtLink :to="`/${$route.params.team ? $route.params.team : 'dashboard'}`" class="block">
            <Logo class="w-auto h-8 text-black dark:text-white" />
          </NuxtLink>

          <!-- <SvgIcon name="custom/separator" class="flex-shrink-0 w-8 h-8 ml-2 text-tw-gray-300" /> -->

          <!-- <TeamsDropdown /> -->
        </div>

        <ProfileDropdown />
      </div>
    </UContainer>
  </nav>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

const user = useStrapiUser() as Ref<User>
</script>
