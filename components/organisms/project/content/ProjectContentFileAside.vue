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

      <UFormGroup
        v-for="field of fields"
        :key="field.key"
        :name="field.key"
        :label="field.label"
        label-class="font-medium u-text-gray-900 truncate"
        label-wrapper-class="flex content-center justify-between min-w-0 gap-3"
        container-class
        :wrapper-class="field.type === 'boolean' ? 'flex items-center justify-between' : ''"
      >
        <UTextarea
          v-if="field.type === 'text'"
          :model-value="field.value"
          :name="field.key"
          :placeholder="`Add a ${field.key.replace(/\./g, ' ')}...`"
          size="sm"
          :resize="false"
          autoresize
          :rows="1"
          appearance="none"
          custom-class="!px-0 placeholder-gray-400 dark:placeholder-gray-500"
          @update:model-value="value => updateField(field.key, value)"
        />
        <UCheckbox v-else-if="field.type === 'boolean'" :model-value="field.value" :name="field.key" @update:model-value="value => updateField(field.key, value)" />
      </UFormGroup>

      <ProjectFileHistory />
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
import { snakeCase } from 'lodash-es'
import type { Project, Root } from '~/types'
import { capitalize } from '~/utils'
import { getPathName } from '~/utils/tree'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const project: Project = inject('project')
const root: Root = inject('root')

const { branch } = useProjectBranches(project)
const { file } = useProjectFiles(project, root)

// Computed

const fields = computed(() => {
  return mapFields({ title: '', description: '', ...props.modelValue })
})

const name = computed(() => getPathName(file.value.path || ''))

// Methods

function updateField (key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function mapFields (fields, parent = '') {
  return Object.entries(fields).flatMap(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return mapFields(value, key)
    }

    if (Array.isArray(value)) {
      return null
    }

    let type = 'text'
    if (typeof value === 'boolean') {
      type = 'boolean'
    }

    let label = parent ? `${parent} ${key}` : key
    label = snakeCase(label).replace(/_/g, ' ')

    return {
      key: parent ? `${parent}.${key}` : key,
      value,
      type,
      label: capitalize(label)
    }
  }).filter(Boolean)
}
</script>
