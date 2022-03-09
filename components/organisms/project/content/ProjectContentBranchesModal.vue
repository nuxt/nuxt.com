<template>
  <UModal v-model="isOpen" header-class body-class="flex-1 h-80 lg:overflow-y-auto">
    <template #header>
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
    </template>

    <ul v-if="filteredBranches?.length" class="divide-y u-divide-gray-200">
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
    <span v-else class="block p-4 text-sm text-center u-text-gray-500">No branch matching your query</span>
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
  }
})

const emit = defineEmits(['update:modelValue', 'selectBranch'])

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

function onBranchClick (b: Branch) {
  emit('selectBranch', b)
  isOpen.value = false
  q.value = ''
}
</script>
