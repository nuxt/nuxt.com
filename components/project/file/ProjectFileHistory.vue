<template>
  <ul role="list" class="divide-y u-divide-gray-200">
    <div v-if="pending" class="flex justify-center py-3">
      <UIcon name="heroicons-outline:refresh" class="w-5 h-5 animate-spin" />
    </div>
    <li v-else-if="!history?.length" class="py-3 text-sm text-center">
      No history yet
    </li>
    <li v-for="commit in history" v-else :key="commit.oid" class="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div class="flex flex-1 min-w-0">
        <div class="flex flex-col -space-y-1.5">
          <UAvatar v-for="author of [...commit.authors].slice(0, 3)" :key="author.login" :src="author.avatarUrl" :alt="author.login" size="xs" />
        </div>
        <div class="flex flex-col flex-1 min-w-0 ml-4">
          <div class="flex items-center justify-between gap-1 truncate">
            <p class="text-sm font-medium truncate u-text-gray-900">
              {{ commit.authors.map(author => author.login).join(', ') }}
            </p>
            <time v-if="commit.date" class="flex-shrink-0 block text-sm u-text-gray-400">{{ useTimeAgo(new Date(commit.date)).value }}</time>
          </div>
          <NuxtLink :to="`https://github.com/${project.repository.owner}/${project.repository.name}/commit/${commit.oid}`" target="_blank" class="flex-shrink-0 block text-sm u-text-gray-500 hover:underline" tabindex="-1">
            <span class="line-clamp-2">{{ commit.message }}</span>
          </NuxtLink>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import type { Project, Root } from '~/types'

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { history, pending, fetch: fetchHistory } = useProjectFileHistory(project.value, root.value)
const { file } = useProjectFiles(project.value, root.value)

onMounted(() => {
  watch(file, fetchHistory, { immediate: true })
})
</script>
