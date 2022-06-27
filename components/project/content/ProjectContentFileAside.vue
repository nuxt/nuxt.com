<template>
  <aside class="hidden overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="computedFile" class="pb-[213px]">
      <div class="flex items-start justify-between p-6">
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
      </div>

      <ProjectContentFileAsideTabs
        :model-value="modelValue"
        @update:model-value="(e) => $emit('update:modelValue', e)"
      />
    </div>
    <div v-else class="flex flex-col items-center justify-center h-full">
      <UIcon name="heroicons-outline:document-text" class="w-12 h-12 mx-auto u-text-gray-400" />
      <h3 class="mt-2 text-sm font-medium u-text-gray-900">
        No file selected
      </h3>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useMagicKeys, whenever, and } from '@vueuse/core'
import type { Project, Root } from '~/types'

defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['update:modelValue'])

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { notUsingInput } = useShortcuts()
const keys = useMagicKeys()
const { branch } = useProjectBranches(project.value)
const { computedFile } = useProjectFiles(project.value, root.value)

const absolutePath = computed(() => {
  return [...project.value.baseDir.split('/').filter(p => p !== '.'), ...computedFile.value?.path?.split('/')]
    .filter(Boolean)
    .join('/')
})

const githubLink = computed(() => {
  return `https://github.com/${project.value.repository.owner}/${project.value.repository.name}/tree/${branch.value.name}/${absolutePath.value}`
})

// Watch

whenever(and(keys.meta_g, notUsingInput), () => {
  window.open(githubLink.value, '_blank')
})
</script>
