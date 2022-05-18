<template>
  <aside class="hidden overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="computedFile" class="pb-[237px]">
      <div class="flex items-start justify-between p-6">
        <div class="min-w-0">
          <h2 class="text-lg font-medium u-text-gray-900">
            <span class="sr-only">Details for </span>{{ computedFile.name }}
          </h2>
          <p class="flex items-center gap-1.5 text-sm min-w-0 u-text-gray-400 truncate">
            <span class="truncate">{{ computedFile.path }}</span>
            <UButton
              icon="heroicons-outline:external-link"
              target="_blank"
              :to="`https://github.com/${project.repository.owner}/${project.repository.name}/tree/${branch.name}/${absolutePath}`"
              variant="transparent"
              size="xxs"
              class="!p-0"
            />
          </p>
        </div>
      </div>

      <div>
        <nav class="flex h-12 px-6 space-x-4 border-b u-border-gray-200">
          <button
            v-for="(category, index) in ['Meta', 'History']"
            :key="index"
            :class="{
              'font-medium u-text-gray-900 u-border-gray-700': selectedIndex === index,
              'u-text-gray-500 hover:u-text-gray-900 border-transparent': selectedIndex !== index
            }"
            class="px-2 -mb-px border-b-2 focus:outline-none"
            tabindex="-1"
            @click="selectedIndex = index"
          >
            {{ category }}
          </button>
        </nav>

        <div class="p-6">
          <div v-if="selectedIndex === 0" class="space-y-6">
            <UFormGroup
              v-for="field of fields"
              :key="field.key"
              :name="field.key"
              :label="field.key"
              label-class="font-medium truncate u-text-gray-900"
              label-wrapper-class="flex content-center justify-between min-w-0 gap-3"
              container-class=""
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
              <UInput
                v-else
                :type="field.type"
                :model-value="field.value"
                :name="field.key"
                :placeholder="`Add a ${field.key.replace(/\./g, ' ')}...`"
                size="sm"
                appearance="none"
                custom-class="!px-0 placeholder-gray-400 dark:placeholder-gray-500"
                @update:model-value="value => updateField(field.key, value)"
              />
            </UFormGroup>
          </div>

          <div v-if="selectedIndex === 1">
            <ProjectFileHistory />
          </div>
        </div>
      </div>
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
import { snakeCase, isPlainObject, isDate, isBoolean, isNumber, assignIn } from 'lodash-es'
import type { Project, Root } from '~/types'
import { capitalize } from '~/utils'

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
const { computedFile } = useProjectFiles(project, root)

const selectedIndex = useState(`project-${project.id}-${root}-aside-tabs`, () => 0)

// Computed

const fields = computed(() => {
  return mapFields({ title: '', description: '', ...props.modelValue })
})

const absolutePath = computed(() => {
  return [...project.baseDir.split('/').filter(p => p === '.'), ...computedFile.value?.path?.split('/')]
    .filter(Boolean)
    .join('/')
})

// Methods

function updateField (key, value) {
  const field = fields.value.find(f => f.key === key)
  const updatedFields = { ...toRaw(props.modelValue) }

  if (['title', 'description'].includes(key) && value === '') {
    value = undefined
  } else if (field.type === 'date') {
    value = new Date(value)
  }

  if (value !== undefined) {
    assignIn(updatedFields, {
      [key]: value
    })
  }
  console.log('updatedFields', updatedFields)
  emit('update:modelValue', updatedFields)
}

function mapFields (fields, parent = '') {
  return Object.entries(fields).flatMap(([key, value]) => {
    if (value && isPlainObject(value)) {
      return mapFields(value, [parent, key].filter(Boolean).join('.'))
    }

    if (Array.isArray(value)) {
      return null
    }

    let type = 'text'
    if (isBoolean(value)) {
      type = 'boolean'
    } else if (isDate(value)) {
      type = 'date'
      value = value.toISOString().substring(0, 10)
    } else if (isNumber(value)) {
      type = 'number'
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
