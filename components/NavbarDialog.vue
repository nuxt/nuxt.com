<template>
  <USlideover v-model="isOpen">
    <template #header>
      <button v-if="selectedLink" @click="selectedLink = null">
        <UIcon name="heroicons-outline:arrow-sm-left" class="flex-shrink-0 w-6 h-6" />
      </button>
      <button v-else @click="isOpen = false">
        <UIcon name="heroicons-outline:x" class="flex-shrink-0 w-6 h-6" />
      </button>

      <p v-if="selectedLink" class="text-lg font-semibold">
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

    <div class="flex-1 px-4 py-4 overflow-y-scroll sm:px-6">
      <DocsAsideTree :tree="tree" :max="selectedLink ? null : 2" @select="onSelect" @close="isOpen = false" />
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { User } from '~/types'

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

const { navigation, navFromPath } = useContent()

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

watch(
  () => route.fullPath,
  () => {
    const path = route.fullPath.split('/').slice(0, 3).join('/')
    const nav = navigation.value ? navFromPath(path) : []

    if (nav && nav.path === path) {
      selectedLink.value = nav
    }
  },
  { immediate: true }
)

const tree = computed(() => {
  if (selectedLink.value) {
    return selectedLink.value.children
  }

  return props.links.map((link) => {
    return {
      ...link,
      ...navFromPath(link.path)
    }
  })
})

const onSelect = (link) => {
  selectedLink.value = link
}

const onClick = () => {
  window.location = getProviderAuthenticationUrl('github') as unknown as Location
}
</script>
