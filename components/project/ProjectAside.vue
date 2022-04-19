<template>
  <div class="flex flex-col w-16">
    <div class="flex-1 flex flex-col min-h-0 overflow-y-auto u-bg-white border-r u-border-gray-200">
      <div class="flex-1">
        <div class="py-4 flex items-center justify-center">
          <NuxtLink :to="{ name: '@team-projects' }" class="inline-flex">
            <UAvatar :src="`https://github.com/${project.repository.owner}.png`" :alt="project.name" size="sm" class="flex-shrink-0" />
          </NuxtLink>
        </div>
        <div aria-label="Sidebar" class="pb-6 flex flex-col items-center space-y-3">
          <UVerticalNavigation :links="links" spacing-class="p-2" badge-base-class="absolute rounded-full leading-none w-4 h-4 u-bg-gray-900 u-text-white flex items-center justify-center font-semibold z-[1] text-[11px] -top-1 -right-1" badge-active-class badge-inactive-class />
        </div>
      </div>
      <div class="flex-shrink-0 pb-2 text-center">
        <ProfileDropdown class="-ml-2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMagicKeys, whenever, and, useActiveElement } from '@vueuse/core'
import type { Project } from '~/types'

const project: Project = inject('project')

const props = defineProps({
  links: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const activeElement = useActiveElement()
const keys = useMagicKeys()

const notUsingInput = computed(() => !(activeElement.value?.tagName === 'INPUT' || activeElement.value?.tagName === 'TEXTAREA' || activeElement.value?.contentEditable === 'true'))

const notUsingMeta = computed(() => !keys.current.has('MetaLeft') && !keys.current.has('MetaRight'))

for (const [index, link] of props.links.entries()) {
  const key = keys[index + 1]

  whenever(and(key, notUsingMeta, notUsingInput), () => {
    router.push(link.to)
  })
}
</script>
