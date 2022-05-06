<template>
  <div>
    <div v-show="isOpen" class="relative z-50">
      <Transition
        enter-active-class="ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isExpanded" class="fixed inset-0 bg-gray-500/75 dark:bg-gray-600/75 transition-opacity cursor-pointer" @click="isExpanded = false" />
      </Transition>

      <UseDraggable
        class="fixed group rounded-lg shadow-2xl overflow-hidden z-50"
        :class="{
          '!left-20 !top-20 inset-20': isExpanded,
          'w-[21rem] aspect-[16/9] cursor-move select-none': !isExpanded
        }"
        :initial-value="{ x, y }"
        :prevent-default="true"
        storage-key="project-preview-position"
        storage-type="session"
      >
        <div v-if="!isExpanded" class="absolute inset-0 group-hover:bg-gray-900/75 flex items-center justify-center dark">
          <UButton
            rounded
            size="xxs"
            icon="heroicons-outline:x"
            class="absolute top-2 right-2 hidden group-hover:block !border-none"
            variant="secondary"
            @click="isOpen = false"
          />

          <UButton
            size="sm"
            icon="heroicons-outline:arrows-expand"
            label="Click to expand"
            trailing
            class="hidden group-hover:flex !border-none"
            variant="secondary"
            @click="isExpanded = true"
          />
        </div>

        <iframe id="iframe" :src="previewUrl" class="w-full h-full" />
      </UseDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UseDraggable } from '@vueuse/components'
import type { Project } from '~/types'

const project: Project = inject('project')

const { previewUrl } = useProjectFiles(project, 'content')
const { isOpen, isExpanded } = useProjectPreview()

// element size - `p-6` (padding: 1.5rem)
const x = window.innerWidth - 336 - 24
const y = window.innerHeight - 189 - 24
</script>
