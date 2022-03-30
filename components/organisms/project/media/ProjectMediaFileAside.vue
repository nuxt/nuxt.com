<template>
  <aside class="hidden p-6 overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="file" class="pb-16 space-y-6">
      <div>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-lg font-medium u-text-gray-900">
              <span class="sr-only">Details for </span>{{ file.name }}
            </h2>
            <p class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
              <span class="truncate">{{ file.path }}</span>
              <UButton
                icon="heroicons-outline:external-link"
                target="_blank"
                :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${absolutePath}`"
                variant="transparent"
                size="xxs"
                class="!p-0"
              />
            </p>
          </div>

          <a :download="file.name" :href="fileDownloadLink">
            <UButton icon="heroicons-outline:cloud-download" variant="gray" rounded />
          </a>
        </div>
      </div>

      <div>
        <h3 class="font-medium u-text-gray-900">
          Information
        </h3>
        <dl class="mt-2 border-t border-b u-border-gray-200 divide-y u-divide-gray-200">
          <div class="flex justify-between py-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Size
            </dt>
            <dd class="u-text-gray-900">
              {{ toFormattedBytes(file.size) }}
            </dd>
          </div>
          <div v-if="file.width && file.height" class="flex justify-between py-3 text-sm font-medium">
            <dt class="u-text-gray-500">
              Dimensions
            </dt>
            <dd class="u-text-gray-900">
              {{ file.width }} x {{ file.height }}
            </dd>
          </div>
        </dl>
      </div>

      <ProjectFileHistory />
    </div>
    <div v-else class="h-full flex flex-col items-center justify-center">
      <UIcon name="heroicons-outline:photograph" class="mx-auto h-12 w-12 u-text-gray-400" />
      <h3 class="mt-2 text-sm font-medium u-text-gray-900">
        No file selected
      </h3>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Project, Root } from '~/types'
import { toFormattedBytes } from '~/utils'

const project: Project = inject('project')
const root: Root = inject('root')

const { branch } = useProjectBranches(project)
const { file } = useProjectFiles(project, root)

const absolutePath = computed(() => {
  return [...project.baseDir.split('/'), ...file.value.path.split('/')]
    .filter(Boolean)
    .join('/')
})

const fileDownloadLink = computed(() => `data:image/png;base64,${file.value.content}`)
</script>
