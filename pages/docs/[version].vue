<template>
  <Page :sticky="!!$route.params.slug">
    <template #header>
      <SubNavbar title="Framework" :links="links">
        <template #left>
          <div class="flex items-center gap-3">
            <NuxtLink :to="`/docs/${$route.params.version}`" class="font-semibold u-text-gray-900 focus:outline-none" tabindex="-1">
              Framework
            </NuxtLink>

            <USelectCustom
              v-model="version"
              name="version"
              :options="versions"
              size="xs"
              text-attribute="key"
              appearance="invert"
              icon-base-class="u-text-white"
              list-base-class="absolute z-10 w-24 py-1 mt-1 overflow-auto text-sm rounded-md shadow-lg u-bg-black max-h-60 focus:outline-none ring-1 u-ring-white"
              list-option-active-class="text-white bg-primary-600"
              list-option-inactive-class="u-text-gray-50"
            />
          </div>
        </template>

        <template #right>
          <UButton v-if="version === '3.x'" icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/framework" class="!p-0" />
          <UButton v-else-if="version === '2.x'" icon="fa-brands:github" variant="transparent" to="https://github.com/nuxt/nuxt.js" class="!p-0" />
        </template>
      </SubNavbar>
    </template>

    <template v-if="$route.params.slug && tree && tree.length" #aside>
      <DocsAsideTree :tree="tree" />
    </template>

    <NuxtPage />
  </Page>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { navFromPath } = useContent()

const links = computed(() => navFromPath(`/docs/${route.params.version}`)?.children)
const path = computed(() => route.path.split('/').slice(0, 4).join('/'))
const tree = computed(() => navFromPath(path.value)?.children)

const versions = [{ key: '3.x' }, { key: '2.x' }]
const version = computed({
  get () {
    return versions.find(v => v.key === route.params.version)
  },
  set (version) {
    return router.push(`/docs/${version?.key}`)
  }
})
</script>
