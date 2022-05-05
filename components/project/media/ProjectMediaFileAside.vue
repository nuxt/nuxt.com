<template>
  <aside class="hidden overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="computedFile">
      <div class="flex items-center justify-between gap-3 p-6">
        <div class="min-w-0">
          <h2 class="text-lg font-medium u-text-gray-900">
            <span class="sr-only">Details for </span>{{ computedFile.name }}
          </h2>
          <p class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
            <span class="truncate">{{ computedFile.path }}</span>
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

        <a :download="computedFile.name" :href="fileDownloadLink">
          <UButton icon="heroicons-outline:cloud-download" variant="gray" rounded />
        </a>
      </div>

      <div>
        <nav class="flex h-16 space-x-4 border-b u-border-gray-200 px-6">
          <button
            v-for="(category, index) in ['Meta', 'History']"
            :key="index"
            :class="{ 'font-medium u-text-black u-border-gray-600': selectedIndex === index }"
            class="u-text-gray-800 border-b border-transparent px-2 -mb-[1px]"
            @click="selectedIndex = index"
          >
            {{ category }}
          </button>
        </nav>

        <div class="p-6">
          <div v-if="selectedIndex === 0" class="space-y-6">
            <dl class="border-b u-border-gray-200 divide-y u-divide-gray-200">
              <div class="flex justify-between py-3 text-sm font-medium">
                <dt class="u-text-gray-500">
                  Size
                </dt>
                <dd class="u-text-gray-900">
                  {{ toFormattedBytes(computedFile.size) }}
                </dd>
              </div>
              <div v-if="medias[computedFile.path]" class="flex justify-between py-3 text-sm font-medium">
                <dt class="u-text-gray-500">
                  Dimensions
                </dt>
                <dd class="u-text-gray-900">
                  {{ medias[computedFile.path].width }} x {{ medias[computedFile.path].height }}
                </dd>
              </div>
            </dl>
          </div>

          <div v-if="selectedIndex === 1">
            <ProjectFileHistory />
          </div>
        </div>
      </div>
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

defineProps({
  medias: {
    type: Object,
    default: () => ({})
  }
})

const project: Project = inject('project')
const root: Root = inject('root')

const { branch } = useProjectBranches(project)
const { computedFile } = useProjectFiles(project, root)

const selectedIndex = useState(`project-${project.id}-${root}-aside-tabs`, () => 0)

const absolutePath = computed(() => {
  return [...project.baseDir.split('/').filter(p => p === '.'), ...computedFile.value?.path?.split('/')]
    .filter(Boolean)
    .join('/')
})

const fileDownloadLink = computed(() => `data:image/png;base64,${computedFile.value?.content}`)
</script>
