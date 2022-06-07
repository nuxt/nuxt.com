<template>
  <USelect
    v-model="version"
    name="version"
    :options="versions"
    size="xs"
    text-attribute="label"
    value-attribute="key"
    class="mr-px -my-1"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { versions, selectedVersion } = useModules()

const version = computed({
  get () {
    return selectedVersion.value?.key
  },
  set (version) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        version: version || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
