<script setup lang="ts">
import type { MDCRoot } from '@nuxtjs/mdc'
import CodeIcon from '@nuxt/ui/components/prose/CodeIcon.vue'

interface CodeExplorerTreeItem {
  filename: string
  path: string
  children?: CodeExplorerTreeItem[]
  defaultExpanded?: boolean
}

interface CodeExplorerData {
  tree: CodeExplorerTreeItem[]
  files: Record<string, {
    filename: string
    path: string
    dir: string
    language: string
    body: MDCRoot
  }>
}

const props = defineProps<{
  path: string
  defaultValue?: string
}>()

const apiUrl = computed(() => `/api/examples/code-explorer/${props.path}.json`)

prerenderRoutes([apiUrl.value])
const nuxtApp = useNuxtApp()
const { data } = await useFetch<CodeExplorerData>(apiUrl, {
  getCachedData: key => nuxtApp.payload.data[key]
})

const selected = ref(
  props.defaultValue ? findFile(props.defaultValue, data.value?.tree) : findFirstFile(data.value?.tree)
)
const selectedFile = computed(() => (selected.value ? data.value?.files[selected.value.path] : undefined))

expandDefaultSelected(data.value?.tree)

function findFirstFile(items: CodeExplorerTreeItem[] = []): CodeExplorerTreeItem | undefined {
  for (const item of items) {
    if (!item.children) return item
    const found = findFirstFile(item.children)
    if (found) return found
  }
}

function findFile(path: string, items: CodeExplorerTreeItem[] = []): CodeExplorerTreeItem | undefined {
  for (const item of items) {
    if (item.path === path) return item
    if (item.children) {
      const found = findFile(path, item.children)
      if (found) return found
    }
  }
}

function expandDefaultSelected(items: CodeExplorerTreeItem[] = []) {
  for (const item of items) {
    if (item.children && selected.value?.path.startsWith(item.path + '/')) {
      item.defaultExpanded = true
      expandDefaultSelected(item.children)
    }
  }
}

function onSelect(e: Event, item: CodeExplorerTreeItem) {
  if (item?.children || item.path === selected.value?.path) {
    e.preventDefault()
  }
}

const docsMapping = {
  'app.vue': '/docs/directory-structure/app/app',
  'app.config.ts': '/docs/directory-structure/app/app-config',
  'package.json': '/docs/directory-structure/package',
  'nuxt.config.ts': '/docs/directory-structure/nuxt-config',
  'tsconfig.json': '/docs/directory-structure/tsconfig',
  'app/assets/': '/docs/directory-structure/app/assets',
  'app/components/': '/docs/directory-structure/app/components',
  'components/': '/docs/directory-structure/app/components',
  'app/composables/': '/docs/directory-structure/app/composables',
  'composables/': '/docs/directory-structure/app/composables',
  'app/layouts/': '/docs/directory-structure/app/layouts',
  'layouts/': '/docs/directory-structure/app/layouts',
  'app/middleware/': '/docs/directory-structure/app/middleware',
  'middleware/': '/docs/directory-structure/app/middleware',
  'app/pages/': '/docs/directory-structure/app/pages',
  'pages/': '/docs/directory-structure/app/pages',
  'app/plugins/': '/docs/directory-structure/app/plugins',
  'plugins/': '/docs/directory-structure/app/plugins',
  'app/utils/': '/docs/directory-structure/app/utils',
  'utils/': '/docs/directory-structure/app/utils',
  'error.vue': '/docs/directory-structure/app/error',
  'content/': '/docs/directory-structure/content',
  'layers/': '/docs/directory-structure/layers',
  'modules/': '/docs/directory-structure/modules',
  'public/': '/docs/directory-structure/public',
  'server/api/': '/docs/directory-structure/server',
  'server/routes/': '/docs/directory-structure/server#server-routes',
  'server/middleware/': '/docs/directory-structure/server#server-middleware',
  'server/plugins/': '/docs/directory-structure/server#server-plugins',
  'server/utils/': '/docs/directory-structure/server#server-utilities',
  'shared/': '/docs/directory-structure/shared',
  '.env': '/docs/directory-structure/env',
  '.nuxtignore': '/docs/directory-structure/nuxtignore',
  '.nuxtrc': '/docs/directory-structure/nuxtrc'
}
</script>

<template>
  <div
    v-if="data"
    class="relative border border-muted rounded-lg overflow-hidden not-prose"
  >
    <div class="grid lg:grid-cols-3 lg:h-[450px]">
      <div class="p-2 border-b lg:border-b-0 lg:border-r border-muted overflow-y-auto">
        <UTree
          v-model="selected"
          :items="data.tree"
          color="neutral"
          :get-key="(item) => item.path"
          label-key="filename"
          :ui="{ linkLeadingIcon: 'size-4' }"
          @select="onSelect"
        >
          <template #item-leading="{ item, ui }">
            <CodeIcon
              v-if="!item.children?.length"
              :filename="item.filename"
              :class="ui.linkLeadingIcon({ class: 'size-4' })"
            />
          </template>
        </UTree>
      </div>

      <div class="lg:col-span-2 overflow-auto flex flex-col relative">
        <div
          v-if="selected"
          class="flex items-center justify-between border-b border-muted bg-muted px-4 py-2 sticky top-0 h-10"
        >
          <div class="inline-flex items-center gap-1.5">
            <CodeIcon :filename="selected.filename" />
            <span class="font-mono text-xs truncate">{{ selected.filename }}</span>
          </div>
          <UButton
            v-if="docsMapping[selected.filename] || docsMapping[selectedFile.dir]"
            :to="docsMapping[selected.filename] || docsMapping[selectedFile.dir]"
            label="Open docs"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="ghost"
            size="xs"
          />
        </div>

        <div
          v-if="selectedFile"
          class="code-explorer-content flex-1 flex-col"
        >
          <UTheme :ui="{ prose: { pre: { root: 'my-0 h-full' } } }">
            <MDCRenderer
              :body="selectedFile.body"
              class="h-full"
            />
          </UTheme>
        </div>

        <div
          v-else
          class="flex items-center justify-center h-full p-8 text-sm text-muted"
        >
          Select a file to view its contents
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-explorer-content :deep(pre) {
  margin: 0;
  border: 0;
  border-radius: 0;
  height: 100%;
}
</style>

<style>
.dark .shiki span {
  color: var(--shiki-dark) !important;
}
</style>
