<template>
  <Page :sticky="!!$route.params.slug">
    <template #header>
      <SubNavbar title="Framework" :links="links">
        <template #left>
          <div class="flex items-center gap-3">
            <NuxtLink :to="`/docs/${$route.params.version}`" class="font-semibold u-text-gray-900 focus:outline-none" tabindex="-1">
              Framework
            </NuxtLink>

            <USelect v-model="version" name="version" :options="['3.x', '2.x']" size="xs" />
          </div>
        </template>

        <template #right>
          <UButton v-if="version === '3.x'" icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/framework" class="!p-0" />
          <UButton v-else-if="version === '2.x'" icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/nuxt.js" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <template v-if="$route.params.slug" #aside>
      <DocsAside :level="5" />
    </template>

    <NuxtPage />
  </Page>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { navFromPath } = useContent()

const links = computed(() => navFromPath(`/docs/${route.params.version}`)?.children)

const version = computed({
  get () {
    return route.params.version
  },
  set (value) {
    return router.push(`/docs/${value}`)
  }
})
</script>
