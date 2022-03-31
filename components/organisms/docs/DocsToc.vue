<template>
  <div class="flex flex-col text-sm font-medium text-right gap-y-2 u-text-gray-500">
    <NuxtLink to="#" class="flex justify-end hover:font-semibold hover:u-text-gray-900 gap-x-3">
      <span>Previous page</span>
      <img src="/docs/toc-back.svg" alt="previous page">
    </NuxtLink>
    <div class="flex justify-end font-semibold u-text-gray-900 gap-x-3">
      <span>On this page</span>
      <img src="/docs/toc-current.svg" alt="on this page">
    </div>
    <ul class="flex flex-col pr-2.5">
      <li v-for="link in links" :key="link.label" class="py-1 overflow-hidden truncate border-r-2" :class="route.hash === link.to ? 'u-border-gray-900' : 'u-border-gray-300'">
        <NuxtLink
          :to="{ hash: link.to }"
          class="hover:font-semibold hover:u-text-gray-900"
          :class="[ { 'u-text-gray-900 font-semibold': route.hash === link.to }, link.level === '2' ? 'pr-6 text-xs' : 'mr-2']"
        >
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
    <NuxtLink to="#" class="flex justify-end hover:font-semibold hover:u-text-gray-900 gap-x-3">
      <span>Next page</span>
      <img src="/docs/toc-next.svg" alt="next page">
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps({
  toc: {
    type: Array,
    default: () => []
  }
})

const { updateHeadings } = useScrollspy()
const route = useRoute()

const links = [
  { to: '#usage', label: 'Usage', level: '1' },
  { to: '#example', label: 'Example', level: '1' },
  { to: '#options', label: 'Options', level: '1' },
  { to: '#maxage--expired', label: 'maxAge / expires', level: '2' },
  { to: '#httponly', label: 'Http Only', level: '2' },
  { to: '#secure', label: 'Secure', level: '2' },
  { to: '#domain', label: 'Domain', level: '2' },
  { to: '#path', label: 'Path', level: '2' },
  { to: '#samesite', label: 'Same site', level: '2' },
  { to: '#encore', label: 'Encode', level: '2' },
  { to: '#decode', label: 'Decode', level: '2' },
  { to: '#handling-cookies-in-api-routes', label: 'Handling cookies in API routes', level: '1' }
]

onMounted(() =>
  setTimeout(() => {
    updateHeadings([
      ...document.querySelectorAll('#docs-content h1'),
      ...document.querySelectorAll('#docs-content h2'),
      ...document.querySelectorAll('#docs-content h3')
    ])
  }, 200)
)
</script>
