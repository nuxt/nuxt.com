<template>
  <UInput
    v-model="q"
    name="search"
    placeholder="Search an integration"
    class="w-full md:max-w-sm"
    :size="size"
    autocomplete="off"
    :trailing="size === 'sm'"
  />
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'lg'
  }
})

const route = useRoute()
const router = useRouter()

const q = computed({
  get () {
    return route.query.q
  },
  set (q) {
    router.push({
      name: 'modules',
      query: {
        ...route.query,
        q: q || undefined
      },
      params: {
        stop: 'true'
      }
    })
  }
})
</script>
