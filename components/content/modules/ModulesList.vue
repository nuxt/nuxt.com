<template>
  <Page v-if="!error" id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <ModulesAside :versions="versions" :selected-version="selectedVersion" @update:selected-version="updateSelectedVersion" />
    </template>

    <PageList :title="`${filteredModules.length} module${filteredModules.length > 1 ? 's' : ''} found`">
      <template #heading>
        <ModulesFilterSearch class="hidden md:block" :q="q" @update:q="updateQuery" />
      </template>
      <template #filters>
        <ModulesFilterVersion size="sm" :versions="versions" :selected-version="selectedVersion" class="lg:hidden" @update:selected-version="updateSelectedVersion" />
        <ModulesFilterSearch size="sm" :q="q" class="md:hidden" @update:q="updateQuery" />
        <ModulesFilterType class="lg:hidden" />
        <ModulesFilterCategory class="lg:hidden" />
        <ModulesFilters class="hidden lg:flex" />
        <ModulesFilterSort />
      </template>

      <div class="hidden _ellipse lg:block" />

      <ul v-if="filteredModules.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="filteredModule in filteredModules" :key="filteredModule.name">
          <ModulesListItem :module="filteredModule" />
        </li>
      </ul>
      <div v-else class="relative flex flex-col items-center gap-6 mt-16 lg:mt-24">
        <Icon name="fa-brands:github" class="w-16 h-16 u-text-gray-600" />
        <span class="text-xl font-medium text-center u-text-gray-700">
          There is no module found for <b>{{ q }}</b> yet.<br>Become the first one to create it!
        </span>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <UButton
            to="https://github.com/nuxt/modules"
            target="_blank"
            variant="primary"
            size="lg"
            label="Contribute on GitHub"
            truncate
          />
          <UButton
            to="/docs/guide/going-further/modules"
            variant="secondary"
            size="lg"
            label="How to create a module"
            icon="uil:arrow-right"
            trailing
            truncate
          />
        </div>
      </div>
    </PageList>
  </Page>
  <Page v-else>
    <p class="text-center">
      Sorry an error occured while fetching modules...
    </p>
  </Page>
</template>

<script setup lang="ts">
const { fetchList, filteredModules, q, versions, selectedVersion } = useModules()

const route = useRoute()
const router = useRouter()

const error = await fetchList()

const updateSelectedVersion = (version: {key: string}) => {
  router.replace({
    name: 'modules',
    query: {
      ...route.query,
      version: version?.key || undefined
    },
    state: {
      smooth: '#smooth'
    }
  })
}

const updateQuery = (q: string) => {
  router.replace({
    name: 'modules',
    query: {
      ...route.query,
      q: q || undefined
    },
    state: {
      stop: 'true'
    }
  })
}
</script>

<style scoped>
._ellipse {
  position: absolute;
  width: 600px;
  height: 160px;
  left: 0;
  top: 0;

  background: linear-gradient(97.62deg, rgba(0, 71, 225, 0.22) 2.27%, rgba(26, 214, 255, 0.22) 50.88%, rgba(0, 220, 130, 0.22) 98.48%);
  filter: blur(169px);
  transform: matrix(-0.95, -0.3, -0.3, 0.95, 200, 250);
}
</style>
