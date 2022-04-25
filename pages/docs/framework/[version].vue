<template>
  <DocsPage>
    <template #header>
      <SubNavbar title="Framework" :links="links">
        <template #left>
          <div class="flex items-center gap-3">
            <NuxtLink :to="`/docs/framework/${$route.params.version}`" class="font-semibold u-text-gray-900 focus:outline-none" tabindex="-1">
              Framework
            </NuxtLink>

            <USelect v-model="version" name="version" :options="['v3', 'v2']" size="xs" />
          </div>
        </template>

        <template #right>
          <UButton icon="fa-brands:github" variant="transparent" href="https://github.com/nuxt/framework" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <NuxtPage />
  </DocsPage>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { navFromPath, navigation } = useContent()

console.log('navigation.value', navigation.value)
const path = computed(() => route.path.split('/').slice(0, 4).join('/'))
console.log('path.value', path.value)
const links = computed(() => navFromPath(path.value)?.children)
console.log('links.value', links.value)
const version = computed({
  get () {
    return route.params.version
  },
  set (value) {
    return router.push(`/docs/framework/${value}`)
  }
})
</script>
