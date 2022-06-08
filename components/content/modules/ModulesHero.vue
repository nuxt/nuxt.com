<template>
  <PageHero>
    <template #title>
      <Markdown :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <Markdown :use="$slots.description" unwrap="p" />
    </template>
    <template #extra>
      <ModulesFilterSearch />
    </template>
    <template #image>
      <img src="/assets/modules/gems.svg" class="object-contain h-full mx-10 opacity-30 sm:opacity-100">

      <UCard padded body-class="p-4" class="hidden lg:block absolute left-11 top-3 w-44 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="heroicons-outline:download" class="w-5 h-5 text-teal-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.downloads, 1) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Downloads Last 30 Days
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute -left-10 bottom-0 w-32 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="heroicons-outline:puzzle" class="w-5 h-5 text-green-400" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.modules) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Modules
          </p>
        </div>
      </UCard>

      <UCard padded body-class="p-4" class="hidden lg:block absolute right-0 -bottom-10 w-32 backdrop-blur-lg !bg-opacity-10">
        <UIcon name="heroicons-outline:users" class="w-5 h-5 text-indigoblue-600" />

        <div>
          <p class="mb-2 text-4xl font-semibold u-text-gray-900">
            {{ formatNumber(stats.contributors) }}
          </p>
          <p class="text-xs u-text-gray-500">
            Contributors
          </p>
        </div>
      </UCard>
    </template>
  </PageHero>
</template>

<script setup lang="ts">
import { formatNumber } from '~/utils'

const { stats } = useModules()
</script>
