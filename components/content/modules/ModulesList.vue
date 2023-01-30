<template>
  <Page v-if="!error" id="smooth" class="pt-16 -mt-16">
    <template #aside>
      <CategoriesAside :categories="categories" :selected-category="selectedCategory">
        <template #header>
          <ModulesFilterVersion :versions="versions" :selected-version="selectedVersion" class="mr-1 -my-1" @update:selected-version="replaceRoute('version', $event)" />
        </template>
        <template #footer>
          <div class="flex flex-col gap-2 pt-4 border-t u-border-gray-200">
            <NuxtLink
              to="https://github.com/nuxt/modules"
              target="_blank"
              class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
            >
              <Icon name="fa-brands:github" class="w-4 h-4" />
              Contribute on GitHub
            </NuxtLink>
            <NuxtLink
              to="/docs/guide/going-further/modules"
              class="flex items-center gap-2 text-sm font-medium hover:u-text-gray-900 focus:u-text-gray-900"
            >
              <Icon name="uil:book-open" class="w-4 h-4" />
              Module Author guide
            </NuxtLink>
          </div>
        </template>
      </CategoriesAside>
    </template>

    <PageList :title="`${filteredModules.length} module${filteredModules.length > 1 ? 's' : ''} found`">
      <template #heading>
        <ModulesFilterSearch class="hidden md:block" :q="q" @update:q="replaceRoute('q', $event)" />
      </template>
      <template #filters>
        <ModulesFilterVersion size="sm" :versions="versions" :selected-version="selectedVersion" class="lg:hidden" @update:selected-version="replaceRoute('version', $event)" />
        <ModulesFilterSearch size="sm" :q="q" class="md:hidden" @update:q="replaceRoute('q', $event)" />
        <ModulesFilterType class="lg:hidden" :types="types" :selected-type="selectedType" @update:selected-type="replaceRoute('type', $event)" />
        <ModulesFilterCategory class="lg:hidden" :categories="categories" :selected-category="selectedCategory" @update:selected-category="replaceRoute('category', $event)" />
        <ModulesFilters class="hidden lg:flex" :selected-category="selectedCategory" :selected-type="selectedType" :q="q" />
        <ModulesFilterSort
          :sorts="sorts"
          :selected-sort="selectedSort"
          :orders="orders"
          :selected-order="selectedOrder"
          @update:order-by="replaceRoute('orderBy', $event)"
          @update:sort-by="replaceRoute('sortBy', $event)"
        />
      </template>

      <div class="hidden _ellipse lg:block" />

      <ul v-if="filteredModules.length" class="grid grid-cols-1 gap-8 mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="filteredModule in filteredModules" :key="filteredModule.name">
          <ModulesListItem :module="filteredModule" />
        </li>
      </ul>
      <NotFound
        v-else
        icon="fa-brands:github"
        :buttons="[
          { to: 'https://github.com/nuxt/modules', target: '_blank', variant: 'primary', size: 'lg', label: 'Contribute on GitHub' },
          { to: '/docs/guide/going-further/modules', variant: 'secondary', size: 'lg', label: 'How to create a module', icon: 'uil:arrow-right', trailing: true }]"
      >
        <span>There is no module found for <b>{{ q }}</b> yet.<br>Become the first one to create it!</span>
      </NotFound>
    </PageList>
  </Page>
  <Page v-else>
    <p class="text-center">
      Sorry an error occured while fetching modules...
    </p>
  </Page>
</template>

<script setup lang="ts">
const {
  fetchList,
  filteredModules,
  q,
  versions,
  selectedVersion,
  types,
  selectedType,
  categories,
  selectedCategory,
  orders,
  selectedOrder,
  sorts,
  selectedSort
} = useModules()

const { createReplaceRoute } = useFilters()
const replaceRoute = createReplaceRoute('modules')

const error = await fetchList()

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
