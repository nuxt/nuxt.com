<script setup lang="ts">
import type { Starter } from '../types'

const props = defineProps({
  starter: {
    type: Object as PropType<Starter>,
    default: () => ({})
  }
})

const template = computed(() => {
  return props.starter.repo === 'nuxt/starter'
    ? (props.starter.branch === 'v3')
      ? ''
      : `-t ${props.starter.branch} `
    : `-t "${props.starter.repo}#${props.starter.branch}" `
})

const command = computed(() => {
  return `npx nuxi init ${template.value}<${template.value.includes('module') ? 'module' : 'app' }>`
})
</script>

<template>
  <UPageCard>
    <div class="flex flex-col gap-y-4 justify-center items-center w-full not-prose">
      <NuxtImg :src="starter.image" width="40" height="40" :alt="starter.name" />
      <UButton
        target="_blank"
        :to="`https://github.com/${starter.repo}/tree/${starter.branch}`"
        size="sm"
        _target="blank"
        class="flex gap-x-4 transition-colors duration-200 items-center justify-center "
        variant="ghost"
        color="gray"
        :ui="{ shadow: 'shadow-none' }"
      >
        <span class="text-gray-950 dark:text-white font-bold text-2xl">{{ starter.name }}</span>
        <UIcon name="i-simple-icons-github" class="h-5 w-5" />
      </UButton>
      <p class="text-center text-lg text-gray-600 dark:text-gray-400 -mt-4 pb-3">
        {{ starter.description }}
      </p>
      <UPageGrid :ui="{ wrapper: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 justify-between w-full gap-3' }">
        <UButton
          target="_blank"
          :to="`https://codesandbox.io/s/github/${starter.repo}/tree/${starter.branch}/${starter.dir || ''}`"
          color="gray"
          label="CodeSandbox"
          icon="i-simple-icons-codesandbox"
          class="flex justify-center items-center"
          size="sm"
          :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
        />

        <UButton
          target="_blank"
          :to="`https://stackblitz.com/github/${starter.repo}/tree/${starter.branch}/${starter.dir || ''}`"
          label="StackBlitz"
          color="gray"
          icon="i-simple-icons-stackblitz"
          class="flex justify-center items-center"
          size="sm"
        />
      </UPageGrid>

      <CopyButton :text="command" class="w-full" size="sm" />
    </div>
  </UPageCard>
</template>
