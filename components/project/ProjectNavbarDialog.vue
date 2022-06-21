<template>
  <USlideover v-model="isOpen">
    <template #header>
      <div class="flex items-center mr-3">
        <button v-if="isTreeOpen" @click="isTreeOpen = false">
          <UIcon name="heroicons-outline:arrow-sm-left" class="flex-shrink-0 w-6 h-6" />
        </button>
        <button v-else @click="isOpen = false">
          <UIcon name="heroicons-outline:x" class="flex-shrink-0 w-6 h-6" />
        </button>
      </div>

      <p v-if="isTreeOpen" class="text-lg font-semibold capitalize">
        {{ selectedLink }}
      </p>
      <NuxtLink v-else :to="{ name: '@team-projects' }" class="text-lg font-semibold capitalize">
        {{ project.name }}
      </NuxtLink>

      <div class="flex justify-end flex-1">
        <UButton
          size="xs"
          label="Create file"
          variant="gray"
          icon="heroicons-outline:plus"
          truncate
          :class="{ 'hidden': selectedLink !== 'content' || !isTreeOpen}"
          @click="createFile"
        />
        <UButton
          size="xs"
          label="Upload file"
          variant="gray"
          icon="heroicons-outline:plus"
          truncate
          :class="{ 'hidden': selectedLink !== 'media' || !isTreeOpen}"
          @click="uploadFile"
        />
      </div>
    </template>

    <div class="flex flex-col justify-between flex-1 overflow-y-auto">
      <ProjectContentFilesTree v-if="isTreeOpen" :tree="selectedTree" class="py-2" @select="isOpen = false" />
      <UVerticalNavigation v-else :links="mobileLinks[0]" class="px-2 py-4 sm:px-4" />

      <UVerticalNavigation :links="mobileLinks[1]" class="px-2 py-4 sm:px-4" badge-base-class="ml-auto truncate max-w-[128px] inline-block py-0.5 px-3 text-xs rounded-full" />
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { WritableComputedRef, ComputedRef, Ref, PropType } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import type { Project, File, Root } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array as PropType<{ to: RouteLocationNormalized, icon: string, label: string, badge: boolean, click: Function | null }[][]>,
    default: () => []
  }
})
const emit = defineEmits(['update:modelValue'])

const root: Ref<Root> = ref('content')
const project: Ref<Project> = inject('project')

provide('root', root)

const { openCreateModal: openCreateFileModal } = useProjectFiles(project.value, root.value)
const { tree: contentTree } = useProjectFilesTree(project.value, 'content')
const { tree: mediaTree } = useProjectFilesTree(project.value, 'public')

const route = useRoute()
const selectedLink = ref(null)
const isTreeOpen = ref(false)

const isOpen: WritableComputedRef<boolean> = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)

    if (!value) {
      // avoids change during dialog animation
      setTimeout(() => {
        isTreeOpen.value = !!selectedLink.value
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

const mobileLinks = computed(() => props.links.map(subLinks => subLinks.map(link => ({
  ...link,
  click: () => onLinkClick(link)
}))))

// Watch

watch(() => route.fullPath, () => {
  switch (route.name) {
    case '@team-project-content':
      root.value = 'content'
      selectedLink.value = 'content'
      break
    case '@team-project-media':
      root.value = 'public'
      selectedLink.value = 'media'
      break
    default:
      selectedLink.value = null
  }

  // avoids change during navigation
  if (!isOpen.value) {
    isTreeOpen.value = !!selectedLink.value
  }
},
{ immediate: true })

// Methods

function createFile () {
  openCreateFileModal('content')
  isOpen.value = false
}

function uploadFile () {
  // FIXME
  // $refs.fileToUpload?.click?.()
  isOpen.value = false
}

function onLinkClick (link) {
  if (link.click) {
    link.click()
  } else if (['@team-project-content', '@team-project-media'].includes(link.to.name) && link.to.name === route.name) {
    isTreeOpen.value = true
    return
  }

  isOpen.value = false
}
</script>
