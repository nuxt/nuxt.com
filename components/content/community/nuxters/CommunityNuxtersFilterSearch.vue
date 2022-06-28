<template>
  <UInput
    v-model="q"
    name="search"
    placeholder="Search a nuxter"
    class="w-full md:max-w-sm"
    :size="size"
    icon="uil:search-alt"
    autocomplete="off"
    :trailing="size === 'sm'"
    autofocus
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
  set (q: string) {
    router.push({
      name: 'community-nuxters',
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
