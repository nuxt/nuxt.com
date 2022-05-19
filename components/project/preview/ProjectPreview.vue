<template>
  <div>
    <div v-if="isOpen" class="relative z-[15]">
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
              icon="heroicons-outline:external-link"
              class="!border-none"
              variant="secondary"
              :to="previewUrlWithPath"
              target="_blank"
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
          :src="src"
          :style="iframeStyle"
          class="w-full h-full"
          @load="onLoad"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { getRoutePath, destructurePathName } from '~/utils/tree'
import type { Project } from '~/types'

const project: Project = inject('project')

const iframe = ref(null)
const loading = ref(true)

const { file, computedFiles, select: selectFile, previewUrl } = useProjectFiles(project, 'content')
const { el, style, iframeStyle, isOpen, isExpand, isDiff, reset } = useProjectPreview()

const previewUrlWithPath = computed(() => {
  const [host, ...query] = previewUrl.value.split('?')

  const route = getRouteFromFile() || ''

  return `${host}${route}?${query.join('&')}`
})

const src = unref(previewUrlWithPath.value)

// Watch

watch(file, postMessage)

// Methods

function refresh () {
  loading.value = true

  iframe.value.src = previewUrlWithPath.value
}

function getRouteFromFile () {
  if (!file.value) {
    return
  }

  const { name, ext } = destructurePathName(file.value.path)
  // Partials are not routes
  if (name.startsWith('_')) {
    return
  }
  // Only md files are routes
  if (!['md'].includes(ext)) {
    return
  }

  return getRoutePath(file.value.path)
}

function postMessage () {
  if (!iframe.value) {
    return
  }

  const route = getRouteFromFile()
  if (!route) {
    return
  }

  iframe.value.contentWindow.postMessage(`push:${route}`, '*')
}

function onLoad () {
  loading.value = false

  setTimeout(() => {
    useEventListener(window, 'message', onMessage)
  }, 1000)
}

function onMessage (e) {
  if (!previewUrl.value.startsWith(e.origin)) {
    return
  }
  if (typeof e.data !== 'string') {
    return
  }

  const [action, ...args] = e.data.split(':')

  if (action === 'push') {
    const path = args[0]

    const fileToSelect = computedFiles.value.find(f => getRoutePath(f.path) === path)
    if (fileToSelect) {
      selectFile(fileToSelect)
    }
  }
}
</script>
