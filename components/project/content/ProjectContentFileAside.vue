<template>
  <aside class="hidden overflow-y-auto u-bg-white border-l u-border-gray-200 top-0 w-96 lg:block sticky h-[calc(100vh-4rem)] flex-shrink-0">
    <div v-if="computedFile">
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

      <TabGroup :selected-index="selectedIndex" as="div" @change="(i) => selectedIndex = i">
        <TabList class="flex h-16 space-x-4 border-b u-border-gray-200 px-6">
          <Tab
            v-for="category in ['Meta', 'History']"
            :key="category"
            v-slot="{ selected }"
            as="template"
          >
            <button
              :class="{ 'font-medium u-text-black u-border-gray-600': selected }"
              class="u-text-gray-800 border-b border-transparent px-2 -mb-[1px]"
            >
              {{ category }}
            </button>
          </Tab>
        </TabList>

        <TabPanels class="p-6">
          <TabPanel class="space-y-6">
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
          </TabPanel>

          <TabPanel>
            <ProjectFileHistory />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
    <div v-else class="h-full flex flex-col items-center justify-center">
      <UIcon name="heroicons-outline:document-text" class="mx-auto h-12 w-12 u-text-gray-400" />
      <h3 class="mt-2 text-sm font-medium u-text-gray-900">
        No file selected
      </h3>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { snakeCase } from 'lodash-es'
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
