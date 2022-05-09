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
        <div v-if="isExpand" class="fixed inset-0 bg-gray-500/75 dark:bg-gray-600/75 transition-opacity cursor-pointer" @click="isExpand = false" />
      </Transition>

      <div
        ref="el"
        class="fixed group ring-1 u-ring-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
        :class="{
          '!left-16 !top-16 !w-auto !h-auto inset-16': isExpand,
          'aspect-[16/9] select-none resize min-w-[160px] min-h-[90px] max-w-[640px] max-h-[360px]': !isExpand
        }"
        :style="style"
      >
        <div v-if="!isExpand" class="absolute inset-0 group-hover:bg-gray-900/75 flex items-center justify-center dark z-50 cursor-move p-2">
          <UButton
            v-show="isDiff"
            rounded
            size="xxs"
            icon="tabler:pin"
            class="absolute top-2 right-10 hidden group-hover:block !border-none"
            variant="secondary"
            @click="reset"
          />
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
            truncate
            trailing
            class="hidden group-hover:flex !border-none"
            variant="secondary"
            @click="isExpand = true"
          />
        </div>

        <iframe
          id="iframe"
          width="1920"
          :class="{ 'collapsed': !isExpand }"
          height="1080"
          :src="previewUrl"
          class="w-full h-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

const { previewUrl } = useProjectFiles(project, 'content')
const { el, style, isOpen, isExpand, isDiff, reset } = useProjectPreview()
</script>

<style scoped>
iframe.collapsed {
  transform: scale(0.25);
  width: 400%;
  height: 400%;
  transform-origin: top left;
}
</style>
