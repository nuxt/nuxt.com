<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <CommunityRepositoriesFilterSearch />
    </template>

    <template #image>
      <img src="/assets/community/repositories/gems.svg" class="object-contain h-full mx-10 opacity-30 md:opacity-100">

      <UCard padded body-class="p-4" class="hidden lg:block absolute -left-20 top-16 w-44 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="uil:star" class="w-5 h-5 text-teal-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.stars, 1) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Stars
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute right-28 -top-4 w-32 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="uil:folder" class="w-5 h-5 text-green-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.count) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Repositories
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute right-10 -bottom-2 w-32 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.collaborators) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Collaborators
          </p>
        </div>
      </UCard>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { stats } = useCommunityRepositories()
</script>
