<template>
  <USlideover v-model="isOpen">
    <template #header>
      <button v-if="subTree" @click="subTree = false">
        <UIcon name="heroicons-outline:arrow-sm-left" class="flex-shrink-0 w-6 h-6" />
      </button>
      <button v-else @click="isOpen = false">
        <UIcon name="heroicons-outline:x" class="flex-shrink-0 w-6 h-6" />
      </button>

      <p v-if="subTree" class="text-lg font-semibold capitalize">
        {{ selectedLink }}
      </p>
      <NuxtLink v-else :to="{ name: '@team-projects' }" class="inline-flex">
        <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
      </NuxtLink>

      <!-- right element -->
      <div />
    </template>

    <ProjectContentFilesTree v-if="subTree" :tree="selectedTree" class="flex-1 py-4 overflow-y-auto" @select="isOpen = false" />
    <UVerticalNavigation v-else :links="links" class="flex-1 px-2 py-4 overflow-y-scroll sm:px-4" @click="isOpen = false" />
  </USlideover>
</template>

<script setup lang="ts">
import type { WritableComputedRef, ComputedRef } from 'vue'
import type { Project, File } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array,
    default: () => []
  }
})
const emit = defineEmits(['update:modelValue'])

const project: Project = inject('project')

const { tree: contentTree } = useProjectFilesTree(project, 'content')
const { tree: mediaTree } = useProjectFilesTree(project, 'public')

const route = useRoute()
const selectedLink = ref(null)
const subTree = ref(false)

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)

    if (!value) {
      // avoids change during dialog animation
      setTimeout(() => {
        subTree.value = !!selectedLink.value
      }, 300)
    }
  }
})

const selectedTree: ComputedRef<File[]> = computed(() => {
  switch (selectedLink.value) {
    case 'content':
      return contentTree.value
    case 'media':
      return mediaTree.value
    default:
      return []
  }
})

watch(
  () => route.fullPath,
  () => {
    // provides root
    // FIXME
    switch (route.name) {
      case '@team-project-content':
        provide('root', 'content')
        break
      case '@team-project-media':
        provide('root', 'public')
        break
    }

    if (['@team-project-content', '@team-project-media'].includes(route.name as string)) {
      selectedLink.value = (route.name as string).split('-').pop()
    } else {
      selectedLink.value = null
    }

    // avoids change during navigation
    if (!isOpen.value) {
      subTree.value = !!selectedLink.value
    }
  },
  { immediate: true }
)
</script>
