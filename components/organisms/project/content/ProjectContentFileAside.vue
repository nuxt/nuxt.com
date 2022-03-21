<template>
  <aside class="hidden p-8 overflow-y-auto bg-white border-l border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)]">
    <div class="pb-16 space-y-6">
      <div>
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-lg font-medium u-text-gray-900">
              <span class="sr-only">Details for </span>{{ name }}
            </h2>
          </div>
        </div>
      </div>
      <UFormGroup name="title" label="Title" label-class="font-medium u-text-gray-900" container-class="mt-2">
        <template #hint>
          <UButton size="xxs" variant="transparent-hover" icon="heroicons-outline:pencil" />
        </template>

        <p class="text-sm text-gray-500 italic">
          {{ form.title || 'Add a title...' }}
        </p>

        <!-- <UInput v-model="form.title" name="title" placeholder="Add a title..." size="sm" class="w-full" /> -->
      </UFormGroup>
      <UFormGroup name="description" label="Description" label-class="font-medium u-text-gray-900" container-class="mt-2">
        <template #hint>
          <UButton size="xxs" variant="transparent-hover" icon="heroicons-outline:pencil" />
        </template>

        <p class="text-sm text-gray-500 italic">
          {{ form.description || 'Add a description...' }}
        </p>

        <!-- <UTextarea v-model="form.description" name="description" placeholder="Add a description..." size="sm" class="w-full" /> -->
      </UFormGroup>
      <div>
        <h3 class="font-medium u-text-gray-900">
          History
        </h3>
        <ul role="list" class="mt-2 border-t border-b border-gray-200 divide-y divide-gray-200">
          <div v-if="historyPending" class="flex justify-center py-3">
            <UIcon name="heroicons-outline:refresh" class="animate-spin h-5 w-5" />
          </div>
          <li v-else-if="!history?.length" class="py-3 text-sm text-center">
            No history yet
          </li>
          <li v-for="commit in history" v-else :key="commit.oid" class="flex items-center justify-between py-3">
            <div class="flex flex-col flex-1 gap-2 truncate">
              <UAvatarGroup :group="commit.authors.map(author => ({ src: author.avatarUrl }))" size="sm" />
              <div class="flex items-center justify-between gap-2 truncate">
                <p class="text-sm font-medium u-text-gray-500 truncate">
                  {{ commit.message }}
                </p>
                <NuxtLink :to="`https://github.com/${project.repository.owner}/${project.repository.name}/commit/${commit.oid}`" target="_blank" class="flex-shrink-0 text-primary-500 text-sm font-medium">
                  {{ commit.shortSha }}
                </NuxtLink>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { GitHubFile, Project, Branch } from '~/types'
import { getPathName } from '~/utils/tree'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  file: {
    type: Object as PropType<GitHubFile>,
    default: null
  },
  project: {
    type: Object as PropType<Project>,
    required: true
  },
  branch: {
    type: Object as PropType<Branch>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const client = useStrapiClient()
const historyData = ref(null)
const historyPending = ref(false)

// Computed

const form = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const name = computed(() => getPathName(props.file.path))

const history = computed(() => {
  return historyData.value?.repository.ref.target.history.nodes.map(commit => ({
    authors: commit.authors.nodes.flatMap(author => author.user),
    message: commit.message,
    oid: commit.oid,
    shortSha: commit.oid.slice(0, 7)
  })) || []
})

// Watch

watch(() => props.file, async () => {
  return await refreshHistory()
})

watch(() => props.branch, async () => {
  return await refreshHistory()
})

// Http

async function refreshHistory () {
  historyPending.value = true

  historyData.value = await client<Object[]>(`/projects/${props.project.id}/files/${encodeURIComponent(props.file.path)}/history`, {
    params: {
      ref: props.branch.name
    }
  })

  historyPending.value = false
}

refreshHistory()
</script>
