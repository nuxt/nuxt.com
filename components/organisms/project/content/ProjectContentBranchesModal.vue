<template>
  <UModal v-model="isOpen" header-class body-class="flex-1 h-80 lg:overflow-y-auto">
    <template #header>
      <div class="flex items-center gap-1.5">
        <UInput
          v-model="q"
          name="q"
          placeholder="Search branch..."
          icon="heroicons-outline:search"
          appearance="none"
          autocomplete="off"
          class="w-full pl-1"
          size="xl"
          autofocus
        />

        <UButton
          :loading="pending"
          icon="heroicons-outline:refresh"
          variant="transparent"
          size="sm"
          class="mr-2"
          @click="$emit('refreshBranches')"
        />
      </div>
    </template>

    <ul class="divide-y u-divide-gray-200">
      <li class="group flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:u-bg-gray-50" @click="onAddBranchClick">
        <div class="flex items-center gap-3 truncate">
          <UIcon name="heroicons-outline:plus" class="flex-shrink-0 w-4 h-4 u-text-gray-400" />
          <span class="text-sm font-medium truncate u-text-gray-700">Create new branch {{ q && !branchExists ? `"${q}"` : '' }}</span>
        </div>

        <UIcon
          name="heroicons-outline:chevron-right"
          class="flex-shrink-0 invisible w-5 h-5 group-hover:visible u-text-gray-400"
        />
      </li>
      <li v-for="branch in filteredBranches" :key="branch.name" class="group flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:u-bg-gray-50" @click="onBranchClick(branch)">
        <div class="flex items-center gap-3 truncate">
          <UIcon name="mdi:source-branch" class="flex-shrink-0 w-4 h-4 u-text-gray-400" />
          <span class="text-sm font-medium truncate u-text-gray-700">{{ branch.name }}</span>
          <UIcon v-if="selectedBranch?.name === branch.name" name="heroicons-outline:check" class="flex-shrink-0 w-4 h-4 text-primary-500" />
        </div>

        <UIcon
          name="heroicons-outline:chevron-right"
          class="flex-shrink-0 invisible w-5 h-5 group-hover:visible u-text-gray-400"
        />
      </li>
    </ul>
  </UModal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Branch } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  branches: {
    type: Array as PropType<Branch[]>,
    default: () => []
  },
  selectedBranch: {
    type: Object as PropType<Branch>,
    default: null
  },
  pending: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'selectBranch', 'refreshBranches', 'newBranch'])

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const q = ref('')
const filteredBranches = computed(() => {
  return props.branches.filter(b => b.name.search(new RegExp(q.value, 'i')) !== -1)
})

const branchExists = computed(() => q.value && props.branches.some(b => b.name === q.value))

function onBranchClick (b: Branch) {
  emit('selectBranch', b)
  isOpen.value = false
  q.value = ''
}

function onAddBranchClick () {
  emit('newBranch', !branchExists.value ? q.value : '')
  isOpen.value = false
  q.value = ''
}
</script>
