<script setup lang="ts">
const props = defineProps({
  starter: {
    type: Object,
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
  <li class="relative w-full h-full flex justify-center items-center p-[1px]">
    <div class="flex w-full h-full text-xs bg-gray-950/60 rounded-xl z-10 py-4 px-5 sm:py-[40px] sm:px-[60px] md:p-6 lg:py-[40px] lg:px-[60px]">
      <div class="flex flex-col gap-y-4 justify-center items-center w-full">
        <img :src="starter.image" width="40" height="40" :alt="starter.name">
        <UButton
          target="_blank"
          :to="`https://github.com/${starter.repo}/tree/${starter.branch}`"
          size="xs"
          _target="blank"
          class="flex gap-x-4 transition-colors duration-200 items-center justify-center"
          variant="ghost"
          color="gray"
        >
          <span class="text-white font-bold text-2xl">{{ starter.name }}</span>
          <UIcon name="i-simple-icons-github" class="h-5 w-5" />
        </UButton>
        <p class="text-center text-lg text-gray-400 -mt-4 pb-3">
          {{ starter.description }}
        </p>
        <div class="grid grid-cols-1 lg:grid-cols-2 justify-between w-full gap-3">
          <UButton
            target="_blank"
            :to="`/c/${starter.slug}`"
            color="gray"
            label="CodeSandbox"
            icon="i-simple-icons-codesandbox"
            class="flex justify-center items-center"
            size="sm"
            :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
          />

          <UButton
            target="_blank"
            :to="`/s/${starter.slug}`"
            label="StackBlitz"
            color="gray"
            icon="i-simple-icons-stackblitz"
            class="flex justify-center items-center"
            size="sm"
          />
        </div>

        <CopyButton :text="command" class="w-full" background="bg-gradient-to-b from-gray-900 to-gray-950 hover:to-gray-800 lg:hover:to-gray-900" size="sm" />
      </div>
    </div>
    <div class="absolute card-bg inset-0 w-full h-full z-[-1] rounded-xl" />
  </li>
</template>

<style scoped lang="postcss">
.card-bg {
  background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
}
</style>
