<template>
  <aside class="hidden p-6 overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="file" class="pb-16 space-y-6">
      <div>
        <div class="flex items-start justify-between">
          <div class="min-w-0">
            <h2 class="text-lg font-medium u-text-gray-900">
              <span class="sr-only">Details for </span>{{ name }}
            </h2>
            <p class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
              <span class="truncate">{{ file.path }}</span>
              <UButton
                icon="heroicons-outline:external-link"
                target="_blank"
                :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${file.path}`"
                variant="transparent"
                size="xxs"
                class="!p-0"
              />
            </p>
          </div>
        </div>
      </div>
      <UFormGroup name="title" label="Title" label-class="font-medium u-text-gray-900" container-class="mt-2">
        <template #hint>
          <UButton size="xxs" variant="transparent" icon="heroicons-outline:pencil" />
        </template>

        <p class="text-sm u-text-gray-500 italic">
          {{ form.title || 'Add a title...' }}
        </p>

        <!-- <UInput v-model="form.title" name="title" placeholder="Add a title..." size="sm" class="w-full" /> -->
      </UFormGroup>
      <UFormGroup name="description" label="Description" label-class="font-medium u-text-gray-900" container-class="mt-2">
        <template #hint>
          <UButton size="xxs" variant="transparent" icon="heroicons-outline:pencil" />
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
        <ul role="list" class="mt-2 border-t border-b u-border-gray-200 divide-y u-divide-gray-200">
          <div v-if="pending" class="flex justify-center py-3">
            <UIcon name="heroicons-outline:refresh" class="animate-spin h-5 w-5" />
          </div>
          <li v-else-if="!history?.length" class="py-3 text-sm text-center">
            No history yet
          </li>
          <li v-for="commit in history" v-else :key="commit.oid" class="flex justify-between py-3 gap-3">
            <div class="flex flex-1">
              <div class="flex flex-col -space-y-1.5">
                <UAvatar v-for="author of commit.authors" :key="author.login" :src="author.avatarUrl" :alt="author.login" size="xs" />
              </div>
              <div class="ml-4 flex flex-col flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium u-text-gray-900">
                    {{ commit.authors.map(author => author.login).join(', ') }}
                  </p>
                  <time v-if="commit.date" class="block u-text-gray-400 text-sm">{{ useTimeAgo(new Date(commit.date)).value }}</time>
                </div>
                <NuxtLink :to="`https://github.com/${project.repository.owner}/${project.repository.name}/commit/${commit.oid}`" target="_blank" class="flex-shrink-0 u-text-gray-500 hover:underline text-sm block">
                  {{ commit.message }}
                  <UIcon name="heroicons-outline:external-link" class="ml-1 w-3 h-3 flex-shrink-0 inline-flex" />
                </NuxtLink>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="text-center">
      <UIcon name="heroicons-outline:document-text" class="mx-auto h-12 w-12 u-text-gray-400" />
      <h3 class="mt-2 text-sm font-medium u-text-gray-900">
        No file selected
      </h3>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import type { Project } from '~/types'
import { getPathName } from '~/utils/tree'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const project: Project = inject('project')
const root: string = inject('root')

const { branch } = useProjectBranches(project)
const { file } = useProjectFiles(project, root)
const client = useStrapiClient()

const historyData = ref(null)
const pending = ref(false)

// Computed

const form = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const name = computed(() => getPathName(file.value.path || ''))

const history = computed(() => {
  return historyData.value?.repository.ref.target.history.nodes.map(commit => ({
    authors: commit.authors.nodes.flatMap(author => author.user),
    message: commit.message,
    oid: commit.oid,
    shortSha: commit.oid.slice(0, 7),
    date: commit.pushedDate
  })) || []
})

// Watch

watch(file, () => fetchHistory())

// Http

async function fetchHistory () {
  if (!file.value) {
    return
  }

  pending.value = true

  historyData.value = await client<Object[]>(`/projects/${project.id}/files/${encodeURIComponent(file.value.path)}/history`, {
    params: {
      ref: branch.value.name
    }
  })

  pending.value = false
}

onMounted(() => {
  fetchHistory()
})
</script>
