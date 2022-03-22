<template>
  <aside class="hidden p-8 overflow-y-auto bg-white border-l border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)]">
    <div class="pb-16 space-y-6">
      <div>
        <div class="flex items-start justify-between">
          <div class="min-w-0">
            <h2 class="text-lg font-medium u-text-gray-900">
              <span class="sr-only">Details for </span>{{ file.name }}
            </h2>
            <p class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
              <span class="truncate">{{ file.path }}</span>
              <UButton
                icon="heroicons-outline:external-link"
                target="_blank"
                :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${file.path}`"
                variant="transparent"
                size="xxs"
                class="!p-0"
              />
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
              Size
            </dt>
            <dd class="u-text-gray-900">
              {{ (file.size / 1000).toFixed(2) }} KB
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
      <div class="flex">
        <a :download="file.name" :href="fileDownloadLink" class="w-full">
          <UButton label="Download" block />
        </a>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')
const root: string = inject('root')

const { branch } = useProjectBranches(project)
const { file } = useProjectFiles(project, root)

const fileDownloadLink = computed(() => `data:image/png;base64,${file.value.content}`)
</script>
