<template>
  <USlideover v-model="isOpen">
    <template #header>
      <UButton v-if="selectedLink" variant="transparent" icon="heroicons-outline:arrow-sm-left" class="-ml-2" @click="selectedLink = null" />
      <UButton v-else variant="transparent" icon="heroicons-outline:x" class="-ml-2" @click="isOpen = false" />

      <p v-if="selectedLink" class="font-semibold text-lg">
        {{ selectedLink.title }}
      </p>
      <NuxtLink v-else to="/" class="block u-text-black" @click="isOpen = false">
        <Logo class="block w-auto h-6" />
      </NuxtLink>

      <div class="flex justify-end">
        <TeamsDropdown v-if="user" />
        <UButton
          v-else
          icon="fa-brands:github"
          variant="transparent"
          class="-mr-2"
          @click="onClick"
        />
      </div>
    </template>

    <div class="p-4 overflow-y-scroll flex-1">
      <DocsAsideTree :tree="tree" :max="selectedLink ? null : 2" @select="onSelect" @close="isOpen = false" />
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'
import { findChildFromPath } from '~/utils/content'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const navigation = inject('navigation')

const user = useStrapiUser() as Ref<User>
const { getProviderAuthenticationUrl } = useStrapiAuth()
const route = useRoute()

const isOpen = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

const selectedLink = ref(null)

watch(() => route.path, () => {
  const path = route.path.split('/').slice(0, 3).join('/')
  selectedLink.value = findChildFromPath(path, navigation)
}, { immediate: true })

const tree = computed(() => {
  if (selectedLink.value) {
    return selectedLink.value.children
  }

  return props.links.map((link) => {
    if (link.title === 'Docs') {
      return {
        ...link,
        ...navigation[0]
      }
    }

    return link
  })
})

const onSelect = (link) => {
  selectedLink.value = link
}

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}
</script>
