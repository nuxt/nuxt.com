<template>
  <aside class="hidden overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="computedFile" class="pb-[237px]">
      <div class="flex items-center justify-between gap-3 p-6">
        <div class="min-w-0">
          <h2 class="text-lg font-medium u-text-gray-900">
            <span class="sr-only">Details for </span>{{ computedFile.name }}
          </h2>
          <div class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
            <span class="truncate">{{ computedFile.path }}</span>

            <UTooltip>
              <UButton
                icon="heroicons-outline:external-link"
                target="_blank"
                :to="githubLink"
                variant="transparent"
                size="xxs"
                class="!p-0"
              />

              <template #text>
                <span class="flex-auto truncate">Open on GitHub</span>
                <kbd class="flex-shrink-0 hidden font-sans text-xs font-semibold u-text-gray-300 sm:inline"><abbr title="Command" class="no-underline">⌘</abbr> G</kbd>
              </template>
            </UTooltip>
          </div>
        </div>

        <a v-if="fileDownloadLink" :download="computedFile.name" :href="fileDownloadLink" tabindex="-1" class="p-2 rounded-full focus:outline-none focus:ring-offset-white dark:focus:ring-offset-black u-bg-gray-100 hover:u-bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900">
          <UIcon name="heroicons-outline:cloud-download" class="w-5 h-5" />
        </a>
      </div>

      <div>
        <nav class="flex h-12 px-6 space-x-4 border-b u-border-gray-200">
          <button
            v-for="(category, index) in ['Meta', 'History']"
            :key="index"
            :class="{
              'font-medium u-text-gray-900 u-border-gray-700': selectedIndex === index,
              'u-text-gray-500 hover:u-text-gray-900 border-transparent': selectedIndex !== index
            }"
            class="px-2 -mb-px border-b-2 focus:outline-none"
            tabindex="-1"
            @click="selectedIndex = index"
          >
            {{ category }}
          </button>
        </nav>

        <div class="p-6">
          <div v-if="selectedIndex === 0" class="space-y-6">
            <dl class="divide-y u-divide-gray-200">
              <div class="flex justify-between pb-3 text-sm font-medium">
                <dt class="u-text-gray-500">
                  Size
                </dt>
                <dd class="u-text-gray-900">
                  {{ toFormattedBytes(computedFile.size) }}
                </dd>
              </div>
              <div v-if="medias[computedFile.path]" class="flex justify-between pt-3 text-sm font-medium">
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
    <div v-else class="flex flex-col items-center justify-center h-full">
      <UIcon name="heroicons-outline:photograph" class="w-12 h-12 mx-auto u-text-gray-400" />
      <h3 class="mt-2 text-sm font-medium u-text-gray-900">
        No file selected
      </h3>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever, and, useActiveElement } from '@vueuse/core'
import { toFormattedBytes } from '~/utils'
import type { Project, Root } from '~/types'

const props = defineProps({
  medias: {
    type: Object,
    default: () => ({})
  }
})

const project: Project = inject('project')
const root: Root = inject('root')

const keys = useMagicKeys()
const activeElement = useActiveElement()
const { branch } = useProjectBranches(project)
const { computedFile } = useProjectFiles(project, root)

const selectedIndex = useState(`project-${project.id}-${root}-aside-tabs`, () => 0)

// Computed

const absolutePath = computed(() => {
  return [...project.baseDir.split('/').filter(p => p !== '.'), ...computedFile.value?.path?.split('/')]
    .filter(Boolean)
    .join('/')
})

const githubLink = computed(() => {
  return `https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.value.name}/${absolutePath.value}`
})

const fileDownloadLink = computed(() => {
  if (!computedFile.value) {
    return
  }

  if (props.medias[computedFile.value.path]) {
    return `data:image/png;base64,${props.medias[computedFile.value.path].content}`
  }
})

const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

// Watch

whenever(and(keys.meta_g, notUsingInput), () => {
  window.open(githubLink.value, '_blank')
})
</script>
