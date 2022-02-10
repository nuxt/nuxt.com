<template>
  <nav class="bg-white dark:bg-black">
    <UContainer padded>
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-6">
          <!-- <NuxtLink :to="`/${$route.params.team ? $route.params.team : 'dashboard'}`" class="block">
            <Logo class="h-8 p-0.5 w-auto u-text-black" />
          </NuxtLink> -->

          <TeamsDropdown />
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
