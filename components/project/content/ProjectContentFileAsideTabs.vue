<template>
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

      <div class="flex items-center justify-end flex-1 h-full gap-3">
        <UButton
          v-if="isDraft(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:reply"
          @click.stop="revertFile(computedFile.path)"
        />
        <UButton
          v-if="!isDeleted(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:pencil"
          @click.stop="renameFile(computedFile.path)"
        />
        <UButton
          v-if="!isDeleted(computedFile)"
          size="xs"
          variant="secondary"
          icon="heroicons-outline:trash"
          @click.stop="deleteFile(computedFile.path)"
        />
      </div>
    </nav>

    <div class="p-6">
      <div v-if="selectedIndex === 0" class="space-y-3">
        <UFormGroup
          v-for="field of fields"
          :key="field.key"
          :name="`aside-${field.key}`"
          label-class="flex items-center gap-1 font-medium truncate u-text-gray-900"
          label-wrapper-class="flex content-center justify-between min-w-0 gap-3 group"
          container-class=""
          :wrapper-class="field.type === 'boolean' ? 'flex items-center justify-between' : ''"
        >
          <template #label>
            {{ field.key }}

            <div v-if="!['title', 'description', 'draft', 'navigation'].includes(field.key)" class="hidden -my-1 group-hover:block">
              <UTooltip :text="`Delete ${field.key}`">
                <UButton icon="heroicons-outline:trash" variant="transparent" size="xxs" @click="removeField(field.key)" />
              </UTooltip>
            </div>
          </template>

          <UTextarea
            v-if="field.type === 'text'"
            :model-value="field.value"
            :name="`aside-${field.key}`"
            placeholder="Enter text..."
            size="sm"
            :resize="false"
            autoresize
            :rows="1"
            appearance="none"
            custom-class="!px-0 placeholder-gray-400 dark:placeholder-gray-500"
            @update:model-value="value => updateField(field.key, value)"
          />
          <UCheckbox v-else-if="field.type === 'boolean'" :model-value="field.value" :name="`aside-${field.key}`" @update:model-value="value => updateField(field.key, value)" />
          <UInput
            v-else
            :type="field.type"
            :model-value="field.value"
            :name="`aside-${field.key}`"
            placeholder="Enter text..."
            size="sm"
            appearance="none"
            custom-class="!px-0 placeholder-gray-400 dark:placeholder-gray-500"
            @update:model-value="value => updateField(field.key, value)"
          />
        </UFormGroup>

        <form @submit.prevent="addField">
          <UFormGroup label-class="flex items-center gap-1 font-medium truncate u-text-gray-900" container-class="flex items-center gap-3" :label="!!form.key && form.key.trim().length > 0 ? form.key : 'New field'">
            <UInput
              v-model="form.key"
              name="key"
              size="sm"
              appearance="none"
              placeholder="Key"
              class="flex-1"
              autocomplete="off"
              custom-class="!px-0 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
            <USelect
              v-model="form.type"
              name="type"
              placeholder="Type"
              :options="['text', 'boolean', 'number', 'date']"
              size="sm"
              appearance="none"
              custom-class="!pl-0 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />

            <UButton
              icon="heroicons-outline:plus"
              type="submit"
              variant="transparent"
              :disabled="form.key.trim().length === 0"
              class="-mr-1"
              size="xxs"
            />
          </UFormGroup>
        </form>
      </div>

      <div v-if="selectedIndex === 1">
        <ProjectFileHistory />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { snakeCase, isPlainObject, isDate, isBoolean, isNumber, set, unset } from 'lodash-es'
import { capitalize } from '~/utils'
import type { Project, Root, GitHubFile } from '~/types'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const project: Ref<Project> = inject('project')
const root: Ref<Root> = inject('root')

const { computedFile, openRenameModal, openRevertModal, openDeleteModal } = useProjectFiles(project.value, root.value)

const selectedIndex = useState(`project-${project.value.id}-${root.value}-aside-tabs`, () => 0)

const form = reactive({ type: 'text', key: '' })

// Computed

const fields = computed(() => {
  return mapFields({ title: '', description: '', draft: false, navigation: true, ...props.modelValue })
})

// Methods
const isDraft = (file: GitHubFile) => !!file.status
const isDeleted = (file: GitHubFile) => file.status === 'deleted'

const revertFile = (path) => {
  openRevertModal(path)
}
const renameFile = (path) => {
  openRenameModal(path)
}
const deleteFile = (path) => {
  openDeleteModal(path)
}

function addField () {
  const updatedFields = { ...toRaw(props.modelValue) }

  const { key, type } = form

  let value
  switch (type) {
    case 'text':
      value = ''
      break
    case 'boolean':
      value = false
      break
    case 'date':
      value = new Date()
      break
    case 'number':
      value = 0
      break
  }

  form.key = ''

  set(updatedFields, key, value)
  emit('update:modelValue', updatedFields)
}

function updateField (key, value) {
  const field = fields.value.find(f => f.key === key)
  const updatedFields = { ...toRaw(props.modelValue) }

  if (['title', 'description'].includes(key) && value === '') {
    value = undefined
  } else if (field.type === 'date') {
    value = new Date(value)
  } else if (field.type === 'number') {
    value = Number(value)
  }

  if (value !== undefined) {
    set(updatedFields, key, value)
  }
  emit('update:modelValue', updatedFields)
}

function removeField (key) {
  const updatedFields = { ...toRaw(props.modelValue) }

  unset(updatedFields, key)

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
