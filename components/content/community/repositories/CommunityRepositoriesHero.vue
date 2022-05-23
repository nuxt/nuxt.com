<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse grid-cols-1 gap-8 md:grid sm:grid-cols-2 lg:grid-cols-3">
      <div class="flex flex-col justify-center py-8 space-y-5 lg:col-span-2">
        <h1 class="text-5xl font-semibold u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="max-w-xl text-lg font-medium u-text-gray-500">
          <Markdown use="description" unwrap="p" />
        </p>

        <CommunityRepositoriesFilterSearch />
      </div>

      <div class="relative flex items-center justify-center lg:col-span-1">
        <div class="relative">
          <img src="/assets/community/repositories/gems.svg" class="h-[280px]">
        </div>

        <UCard padded body-class="p-4" class="absolute left-0 top-0 md:-left-24 md:top-20 w-full md:w-44 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="uil:star" class="w-5 h-5 text-teal-400" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="text-4xl font-semibold u-text-gray-900 md:mb-2">
              {{ formatNumber(stats.stars, 1) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Stars
            </p>
          </div>
        </UCard>

        <UCard padded body-class="p-4" class="absolute left-0 md:left-44 md:-top-4 w-full md:w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="uil:folder" class="w-5 h-5 text-green-400" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="text-4xl font-semibold u-text-gray-900 md:mb-2">
              {{ formatNumber(stats.count) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Repositories
            </p>
          </div>
        </UCard>

        <UCard padded body-class="p-4" class="absolute right-0 bottom-0 md:-bottom-2 md:left-60 w-full md:w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="text-4xl font-semibold u-text-gray-900 md:mb-2">
              {{ formatNumber(stats.collaborators) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Collaborators
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { stats } = useCommunityRepositories()
</script>
