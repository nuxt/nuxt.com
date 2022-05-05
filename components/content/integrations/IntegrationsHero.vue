<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 max-w-xl">
          <Markdown use="description" unwrap="p" />
        </p>

        <IntegrationsFilterSearch />
      </div>

      <div class="flex items-center justify-center lg:col-span-1 relative">
        <img src="/gems.svg" class="h-[280px]">

        <UCard padded body-class="p-4" class="absolute left-0 md:left-11 top-0 md:top-3 w-full md:w-44 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:download" class="w-5 h-5 text-teal-400" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="u-text-gray-900 font-semibold text-4xl md:mb-2">
              {{ formatNumber(stats.downloads, 1) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Downloads Last 30 Days
            </p>
          </div>
        </UCard>

        <UCard padded body-class="p-4" class="absolute left-0 md:-left-10 md:bottom-0 w-full md:w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:puzzle" class="w-5 h-5 text-green-400" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="u-text-gray-900 font-semibold text-4xl md:mb-2">
              {{ formatNumber(stats.modules) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Modules
            </p>
          </div>
        </UCard>

        <UCard padded body-class="p-4" class="absolute right-0 bottom-0 md:-bottom-10 w-full md:w-32 backdrop-blur-lg !bg-opacity-10">
          <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

          <div class="flex items-end justify-between gap-3 md:block">
            <p class="u-text-gray-900 font-semibold text-4xl md:mb-2">
              {{ formatNumber(stats.contributors) }}
            </p>
            <p class="text-xs u-text-gray-500">
              Contributors
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { stats } = useModules()
</script>
