<template>
  <div>
    <h3 class="font-medium u-text-gray-900">
      History
    </h3>
    <ul role="list" class="mt-2 border-t border-b u-border-gray-200 divide-y u-divide-gray-200">
      <div v-if="pending" class="flex justify-center py-3">
        <UIcon name="heroicons-outline:refresh" class="animate-spin h-5 w-5" />
      </div>
      <li v-else-if="!history?.length" class="py-3 text-sm text-center">
        No history yet
      </li>
      <li v-for="commit in history" v-else :key="commit.oid" class="flex justify-between py-3 gap-3">
        <div class="flex flex-1 min-w-0">
          <div class="flex flex-col -space-y-1.5">
            <UAvatar v-for="author of [...commit.authors].slice(0, 3)" :key="author.login" :src="author.avatarUrl" :alt="author.login" size="xs" />
          </div>
          <div class="ml-4 flex flex-col flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 truncate">
              <p class="text-sm font-medium u-text-gray-900 truncate">
                {{ commit.authors.map(author => author.login).join(', ') }}
              </p>
              <time v-if="commit.date" class="block u-text-gray-400 text-sm flex-shrink-0">{{ useTimeAgo(new Date(commit.date)).value }}</time>
            </div>
            <NuxtLink :to="`https://github.com/${project.repository.owner}/${project.repository.name}/commit/${commit.oid}`" target="_blank" class="flex-shrink-0 u-text-gray-500 hover:underline text-sm block">
              <span class="line-clamp-2">{{ commit.message }}</span>
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { Project, Root } from '~/types'

const project: Project = inject('project')
const root: Root = inject('root')

const { history, pending, fetch: fetchHistory } = useProjectFileHistory(project, root)
const { file } = useProjectFiles(project, root)

onMounted(() => {
  watch(file, fetchHistory, { immediate: true })
})
</script>
