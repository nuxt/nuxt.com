<template>
  <aside class="hidden p-8 overflow-y-auto bg-white border-l border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)]">
    <div class="pb-16 space-y-6">
      <div>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-medium u-text-gray-900">
              <span class="sr-only">Details for </span>{{ file.name }}
            </h2>
            <p class="text-sm font-medium u-text-gray-500">
              {{ (file.size / 1000).toFixed(2) }} KB
            </p>
          </div>
        </div>
      </div>
      <div>
        <h3 class="font-medium u-text-gray-900">
          Information
        </h3>
        <dl class="mt-2 border-t border-b border-gray-200 divide-y u-divide-gray-200">
          <div class="flex justify-between py-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Path
            </dt>
            <dd class="u-text-gray-900">
              {{ file.path }}
            </dd>
          </div>
          <div class="flex justify-between py-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Dimensions
            </dt>
            <dd class="u-text-gray-900">
              {{ file.width }} x {{ file.height }}
            </dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 class="font-medium u-text-gray-900">
          History
        </h3>
        <ul role="list" class="mt-2 border-t border-b border-gray-200 divide-y divide-gray-200">
          <li v-for="person in commits" :key="person.id" class="flex items-center justify-between py-3">
            <div class="flex items-center">
              <img :src="person.imageUrl" alt="" class="w-8 h-8 rounded-full">
              <p class="ml-4 text-sm font-medium u-text-gray-900">
                {{ person.name }}
              </p>
            </div>
          </li>
        </ul>
      </div>
      <div class="flex">
        <UButton label="Download" block />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GitHubFile } from '~/types'

defineProps({
  file: {
    type: Object as PropType<GitHubFile>,
    default: null
  }
})

const commits = [
  {
    id: 1,
    name: 'Aimee Douglas',
    imageUrl:
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=1024&h=1024&q=80'
  },
  {
    id: 2,
    name: 'Andrea McMillan',
    imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=oilqXxSqey&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
]
</script>
