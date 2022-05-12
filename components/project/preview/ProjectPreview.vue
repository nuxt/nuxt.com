<template>
  <div>
    <div v-show="isOpen" class="relative z-50">
      <Transition
        enter-active-class="duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isExpand" class="fixed inset-0 transition-opacity cursor-pointer bg-gray-500/75 dark:bg-gray-600/75" @click="isExpand = false" />
      </Transition>

      <div
        ref="el"
        class="fixed z-50 overflow-hidden rounded-lg shadow-lg group ring-1 u-bg-white"
        :class="{
          '!left-16 !top-16 !w-auto !h-auto inset-16 ring-transparent': isExpand,
          'aspect-[16/9] select-none resize min-w-[160px] min-h-[90px] u-ring-gray-200': !isExpand
        }"
        :style="style"
      >
        <div v-if="!isExpand" class="absolute inset-0 z-50 flex items-center justify-center p-2 cursor-move group-hover:bg-gray-900/75 dark">
          <div class="absolute items-center hidden gap-2 right-2 top-2 group-hover:flex">
            <UButton
              v-show="isDiff"
              rounded
              size="xxs"
              icon="tabler:pin"
              class="!border-none"
              variant="secondary"
              @click="reset"
            />
            <UButton
              rounded
              size="xxs"
              icon="heroicons-outline:refresh"
              class="!border-none"
              variant="secondary"
              :loading="loading"
              @click="refresh"
            />
            <UButton
              rounded
              size="xxs"
              icon="heroicons-outline:x"
              class="!border-none"
              variant="secondary"
              @click="isOpen = false"
            />
          </div>

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
          ref="iframe"
          :src="previewUrl"
          :style="iframeStyle"
          class="w-full h-full"
          @load="onLoad"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

const iframe = ref(null)
const loading = ref(true)

const { previewUrl } = useProjectFiles(project, 'content')
const { el, style, iframeStyle, isOpen, isExpand, isDiff, reset } = useProjectPreview()

function refresh () {
  loading.value = true
  iframe.value.src = previewUrl.value
}

function onLoad () {
  loading.value = false
}
</script>
