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
        <div class="flex flex-1">
          <div class="flex flex-col -space-y-1.5">
            <UAvatar v-for="author of commit.authors" :key="author.login" :src="author.avatarUrl" :alt="author.login" size="xs" />
          </div>
          <div class="ml-4 flex flex-col flex-1">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium u-text-gray-900">
                {{ commit.authors.map(author => author.login).join(', ') }}
              </p>
              <time v-if="commit.date" class="block u-text-gray-400 text-sm">{{ useTimeAgo(new Date(commit.date)).value }}</time>
            </div>
            <NuxtLink :to="`https://github.com/${project.repository.owner}/${project.repository.name}/commit/${commit.oid}`" target="_blank" class="flex-shrink-0 u-text-gray-500 hover:underline text-sm block">
              {{ commit.message }}
              <UIcon name="heroicons-outline:external-link" class="ml-1 w-3 h-3 flex-shrink-0 inline-flex" />
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

const { file } = useProjectFiles(project, root)

const { fetch: fetchHistory, pending } = useProjectFileHistory(project, root)

const historyData = ref(null)

// Computed

const history = computed(() => {
  return historyData.value?.repository.ref.target.history.nodes.map(commit => ({
    authors: commit.authors.nodes.flatMap(author => author.user),
    message: commit.message,
    oid: commit.oid,
    shortSha: commit.oid.slice(0, 7),
    date: commit.pushedDate
  })) || []
})

// Watch

watch(file, async () => {
  historyData.value = await fetchHistory(file.value)
})

onMounted(async () => {
  historyData.value = await fetchHistory(file.value)
})
</script>
