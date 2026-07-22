<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Module } from '#shared/types'
import { joinURL } from 'ufo'

definePageMeta({
  heroBackground: 'opacity-50'
})

const input = useTemplateRef('input')
const modulesToAdd = ref<Module[]>([])
const el = useTemplateRef<HTMLElement>('el')

const { replaceRoute } = useFilters('modules')
const { fetchList, filteredModules, q, categories, modules, stats, selectedSort, selectedOrder, selectedCategory, sorts } = useModules()
const { track } = useAnalytics()
const { openInCursor, openInClaudeCode } = useIdeDeeplink()

const cacheControl = useResponseHeader('Cache-Control')
const cdnCacheControl = useResponseHeader('CDN-Cache-Control')

const { data: page } = await useAsyncData('modules-landing', () => queryCollection('landing').path('/modules').first())
if (!page.value) {
  cacheControl.value = 'no-store, no-cache, must-revalidate'
  cdnCacheControl.value = 'no-store'
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

useSeoMeta({
  titleTemplate: '%s',
  title,
  description
})
useCanonical('/raw/modules.md')

if (import.meta.server) {
  prerenderRoutes(['/raw/modules.md'])

  const site = useSiteConfig()
  useSeoMeta({
    ogDescription: description,
    ogTitle: title,
    ogImage: joinURL(site.url, '/modules-social-card.jpg'),
    twitterImage: joinURL(site.url, '/modules-social-card.jpg')
  })
}

await fetchList()

const lastSelectedIndex = ref<number | null>(null)

// O(1) membership lookup so re-rendering the grid on every add/remove doesn't
// re-scan the whole selection for each card (was `modulesToAdd.some(...)`).
const addedModuleNames = computed(() => new Set(modulesToAdd.value.map(m => m.name)))

function toggleModuleSelection(module: Module) {
  const idx = modulesToAdd.value.findIndex(m => m.name === module.name)
  if (idx === -1) {
    modulesToAdd.value.push(module)
  } else {
    modulesToAdd.value.splice(idx, 1)
  }
}

function selectModuleRange(module: Module) {
  const currentIndex = displayedModules.value.findIndex(m => m.name === module.name)
  if (currentIndex === -1) return

  if (lastSelectedIndex.value === null) {
    lastSelectedIndex.value = currentIndex
    toggleModuleSelection(module)
    return
  }

  const [start, end] = [lastSelectedIndex.value, currentIndex].sort((a, b) => a - b)
  modulesToAdd.value = displayedModules.value.slice(start, end + 1)
}

function handleModuleSelect(module: Module, event: MouseEvent) {
  if (event.shiftKey) {
    selectModuleRange(module)
    return
  }

  // metaKey = Cmd on macOS, ctrlKey = Ctrl on Windows/Linux
  toggleModuleSelection(module)
  lastSelectedIndex.value = displayedModules.value.findIndex(m => m.name === module.name)
}

defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus()
  },
  'escape': {
    usingInput: true,
    handler: () => {
      if (modulesToAdd.value.length) clearAllModules()
    }
  }
})

const ITEMS_PER_PAGE = 9
const SCROLL_THRESHOLD = 450
const displayedModules = ref<Module[]>([])
const isLoading = ref(false)

const { y: scrollY } = useWindowScroll()
const { copy } = useClipboard()

const loadMoreModules = () => {
  if (isLoading.value) return

  const currentLength = displayedModules.value.length
  if (currentLength >= filteredModules.value.length) return

  isLoading.value = true

  setTimeout(() => {
    const nextItems = filteredModules.value.slice(
      currentLength,
      currentLength + ITEMS_PER_PAGE
    )
    displayedModules.value.push(...nextItems)
    isLoading.value = false
  }, 300)
}

const initializeModules = () => {
  displayedModules.value = filteredModules.value.slice(0, ITEMS_PER_PAGE * 2)
}

const debouncedLoadMore = useDebounceFn(loadMoreModules, 50)

watch(scrollY, (y) => {
  if (window.innerHeight + y >= document.documentElement.scrollHeight - SCROLL_THRESHOLD) {
    debouncedLoadMore()
  }
})

watch(filteredModules, () => {
  isLoading.value = false
  displayedModules.value = []
  lastSelectedIndex.value = null
  initializeModules()
})

const copyAllInstallCommands = () => {
  const moduleNames = modulesToAdd.value.map(module => module.name)
  const command = buildModuleInstallCommand(moduleNames)
  track('Modules Bulk Install Copied', { count: modulesToAdd.value.length, modules: moduleNames.join(' ') })
  copy(command, {
    title: 'Install command copied to clipboard:',
    description: `Ready to install ${modulesToAdd.value.length} module${modulesToAdd.value.length > 1 ? 's' : ''} at once`
  })
}

const copyAgentPrompt = () => {
  const prompt = buildBulkModuleAgentPrompt(modulesToAdd.value)
  const moduleNames = modulesToAdd.value.map(m => m.name).join(' ')
  track('Modules Agent Prompt Copied', { count: modulesToAdd.value.length, modules: moduleNames })
  copy(prompt, {
    title: 'Agent prompt copied to clipboard!',
    description: `Prompt ready for ${modulesToAdd.value.length} module${modulesToAdd.value.length > 1 ? 's' : ''}`,
    icon: 'i-custom-ai'
  })
}

function openBulkPromptInCursor() {
  track('Modules Agent Prompt Opened', { count: modulesToAdd.value.length, ide: 'cursor' })
  openInCursor(buildBulkModuleAgentPrompt(modulesToAdd.value))
}

function openBulkPromptInClaudeCode() {
  track('Modules Agent Prompt Opened', { count: modulesToAdd.value.length, ide: 'claude' })
  openInClaudeCode(buildBulkModuleAgentPrompt(modulesToAdd.value))
}

const agentPromptItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Copy agent prompt',
    icon: 'i-custom-ai',
    onSelect: copyAgentPrompt
  },
  {
    label: 'Open in Cursor',
    icon: 'i-simple-icons-cursor',
    onSelect: openBulkPromptInCursor
  },
  {
    label: 'Open in Claude Code',
    icon: 'i-simple-icons-anthropic',
    onSelect: openBulkPromptInClaudeCode
  }
])

const clearAllModules = () => {
  modulesToAdd.value = []
  lastSelectedIndex.value = null
}

initializeModules()
</script>

<template>
  <UContainer ref="el">
    <ClientOnly>
      <LazyModulesMarquee :modules="modules" />
    </ClientOnly>

    <UPageHero
      class="z-20 relative pt-24"
      :ui="{
        title: 'text-4xl sm:text-7xl text-balance max-w-4xl mx-auto',
        links: 'max-w-2xl mx-auto'
      }"
    >
      <template #title>
        Build faster with <span class="text-primary">{{ modules.length }}+</span> Nuxt Modules
      </template>

      <template #description>
        Discover our list of modules to supercharge your Nuxt project. Created and maintained by more than {{ stats.contributors.toString() }} people from the Nuxt team and community.
      </template>

      <template #links>
        <div class="flex flex-col w-full gap-3">
          <div class="flex flex-col sm:flex-row w-full gap-2 relative">
            <UInput
              ref="input"
              :model-value="q"
              name="q"
              icon="i-lucide-search"
              placeholder="Search a module..."
              class="w-full"
              size="lg"
              autofocus
              autocomplete="off"
              variant="subtle"
              @update:model-value="replaceRoute('q', $event as string)"
            >
              <template #trailing>
                <UButton
                  v-if="q"
                  color="neutral"
                  variant="link"
                  size="lg"
                  icon="i-lucide-x"
                  @click="replaceRoute('q', '')"
                />
                <UKbd v-else value="/" class="hidden sm:flex" />
              </template>
            </UInput>

            <div class="hidden sm:flex gap-2 sm:w-auto">
              <USelectMenu
                :model-value="selectedSort"
                :items="sorts"
                size="lg"
                color="neutral"
                class="w-auto"
                variant="outline"
                @update:model-value="replaceRoute('sortBy', $event)"
              />

              <UButton
                :icon="selectedOrder.icon"
                size="lg"
                color="neutral"
                variant="outline"
                @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
              >
                <span class="sr-only">Sort by {{ selectedOrder.label }}</span>
              </UButton>
            </div>
          </div>

          <div class="flex sm:hidden gap-2">
            <USelectMenu
              :model-value="selectedCategory"
              :items="categories"
              size="lg"
              color="neutral"
              variant="outline"
              class="flex-1"
              placeholder="Select category"
              @update:model-value="replaceRoute('category', $event)"
            />
            <UButton
              v-if="selectedCategory"
              icon="i-lucide-x"
              size="lg"
              color="neutral"
              variant="outline"
              aria-label="Clear category filter"
              @click="replaceRoute('category', '')"
            />
            <USelectMenu
              :model-value="selectedSort"
              :items="sorts"
              size="lg"
              color="neutral"
              class="w-1/3"
              variant="outline"
              @update:model-value="replaceRoute('sortBy', $event)"
            />
            <UButton
              :icon="selectedOrder.icon"
              size="lg"
              color="neutral"
              variant="outline"
              @click="replaceRoute('orderBy', selectedOrder.key === 'desc' ? 'asc' : 'desc')"
            />
          </div>
        </div>

        <div class="hidden sm:flex mt-6 flex-wrap gap-1.5 justify-center">
          <UButton
            v-for="category in categories"
            :key="category.key"
            v-bind="category"
            color="neutral"
            variant="outline"
            active-color="primary"
            active-variant="subtle"
            size="sm"
          />
        </div>
      </template>
    </UPageHero>

    <UPage id="smooth" class="relative z-20">
      <UPageBody>
        <div class="flex justify-between mb-4 text-muted text-xs">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1.5">
              <UKbd value="meta" size="sm" />+click to select · Shift+click for a range · Esc to clear
            </span>
          </div>
          <ULink to="/docs/guide/modules/getting-started" class="hidden md:flex items-center gap-1">
            Create your own module
            <UIcon name="i-lucide-arrow-right" class="size-4" />
          </ULink>
        </div>

        <UPageGrid v-if="filteredModules?.length" class="lg:grid-cols-2 xl:grid-cols-3">
          <ModuleItem
            v-for="module in displayedModules"
            :key="module.name"
            :module="module"
            :is-added="addedModuleNames.has(module.name)"
            selectable
            @add="modulesToAdd.push(module)"
            @remove="modulesToAdd = modulesToAdd.filter(m => m.name !== module.name)"
            @select="handleModuleSelect"
          />

          <template v-if="isLoading">
            <div v-for="n in ITEMS_PER_PAGE" :key="n" class="flex flex-col gap-4 p-4 rounded-lg border border-default">
              <div class="flex items-center gap-3">
                <USkeleton class="h-8 w-8 rounded" />
              </div>
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-4 w-full" />
              <div class="flex gap-2">
                <USkeleton class="h-6 w-16" />
                <USkeleton class="h-6 w-16" />
              </div>
            </div>
          </template>
        </UPageGrid>

        <EmptyCard v-else :label="`There is no module found for ${q} yet. Become the first one to create it!`">
          <UButton
            label="Contribute on GitHub"
            color="neutral"
            to="https://github.com/nuxt/modules"
            target="_blank"
            size="md"
            @click="$router.replace({ query: {} })"
          />
          <UButton to="/docs/guide/going-further/modules" color="neutral" size="md" label="How to create a module?" />
        </EmptyCard>
      </UPageBody>

      <AnimatePresence>
        <motion.div
          v-if="modulesToAdd.length"
          key="toolbar"
          class="fixed z-50 bottom-0 left-0 right-0"
          :initial="{ y: 100, opacity: 0 }"
          :animate="{ y: 0, opacity: 1 }"
          :exit="{ y: 100, opacity: 0 }"
          :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
        >
          <div class="flex flex-col items-center mb-6">
            <div class="relative flex mb-0.5 p-1 rounded-full border border-default bg-default/90 backdrop-blur-lg">
              <UAvatarGroup size="3xs" :max="6">
                <TransitionGroup name="avatar-pop">
                  <UTooltip
                    v-for="m in modulesToAdd"
                    :key="m.name"
                    :text="m.npm"
                    :content="{
                      side: 'top'
                    }"
                  >
                    <UAvatar
                      :src="moduleImage(m.icon)"
                      :icon="moduleIcon(m.category)"
                      :alt="m.name"
                      :ui="{ root: 'size-3.5 text-[6px]' }"
                      class="rounded-full bg-default ring-1 ring-default"
                    />
                  </UTooltip>
                </TransitionGroup>
              </UAvatarGroup>
            </div>

            <div class="relative z-10 bg-default/80 backdrop-blur-lg rounded-full p-1 border border-default dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex items-center gap-4">
              <motion.div class="flex items-center gap-1">
                <UTooltip text="Copy install command">
                  <Motion :press="{ scale: 0.99 }">
                    <UButton
                      color="primary"
                      variant="soft"
                      size="lg"
                      icon="i-lucide-download"
                      class="font-medium rounded-full"
                      @click="copyAllInstallCommands"
                    >
                      Install {{ modulesToAdd.length }} module{{ modulesToAdd.length > 1 ? 's' : '' }}
                    </UButton>
                  </Motion>
                </UTooltip>

                <Motion :press="{ scale: 0.99 }">
                  <UFieldGroup>
                    <UTooltip text="Copy agent prompt to install & configure">
                      <UButton
                        color="neutral"
                        variant="soft"
                        size="lg"
                        icon="i-custom-ai"
                        class="rounded-s-full"
                        @click="copyAgentPrompt"
                      />
                    </UTooltip>

                    <UDropdownMenu :items="agentPromptItems" :content="{ align: 'end' }">
                      <UButton
                        color="neutral"
                        variant="soft"
                        size="lg"
                        icon="i-lucide-chevron-down"
                        class="rounded-e-full"
                        aria-label="More agent prompt options"
                      />
                    </UDropdownMenu>
                  </UFieldGroup>
                </Motion>

                <UTooltip text="Clear selection">
                  <Motion :press="{ scale: 0.99 }">
                    <UButton
                      color="neutral"
                      variant="soft"
                      size="lg"
                      icon="i-lucide-x"
                      class="rounded-full"
                      @click="clearAllModules"
                    />
                  </Motion>
                </UTooltip>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </UPage>
  </UContainer>
</template>

<style scoped>
.avatar-pop-move {
  transition: transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
}

.avatar-pop-enter-active {
  transition: opacity 0.15s cubic-bezier(0.23, 1, 0.32, 1), scale 0.15s cubic-bezier(0.23, 1, 0.32, 1);
}

.avatar-pop-leave-active {
  position: absolute;
  transition: opacity 0.1s ease-in, scale 0.1s ease-in;
}

.avatar-pop-enter-from,
.avatar-pop-leave-to {
  opacity: 0;
  scale: 0.9;
}
</style>
