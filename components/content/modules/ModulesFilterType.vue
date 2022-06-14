<template>
  <USelectCustom
    v-model="type"
    name="type"
    :options="typesWithPlaceholder"
    size="sm"
    placeholder="Type"
    value-attribute="key"
    text-attribute="title"
    class="min-w-[144px]"
  />
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { types, selectedType } = useModules()

const typesWithPlaceholder = computed(() => [
  {
    key: '',
    title: 'All'
  },
  ...types.value
])

const type = computed({
  get () {
    return selectedType.value
  },
  set (type) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        type: type?.key || undefined
      },
      params: {
        smooth: '#smooth'
      }
    })
  }
})
</script>
