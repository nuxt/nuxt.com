<template>
  <div class="flex flex-col flex-1">
    <TeamPageHeader title="Let's build something new." description="Import an existing Git repository or get started with one of our templates." />

    <TeamPage overlap>
      <div class="grid gap-8 sm:grid-cols-2">
        <UCard padded base-class="flex flex-col overflow-hidden lg:h-[calc(100vh-352px)] lg:min-h-[528px]" body-class="flex-1 lg:overflow-y-auto" footer-background-class="u-bg-gray-50" shadow-class="">
          <template #header>
            <div class="flex items-center justify-between min-w-0 gap-3">
              <h3 class="text-2xl font-semibold truncate u-text-gray-900">
                Import Git repository
              </h3>
              <a :href="githubAppUrl" class="flex-shrink-0 block text-sm font-medium text-primary-500 hover:underline" target="_blank">Add GitHub account →</a>
            </div>

            <div v-if="installations.length" class="flex flex-wrap-reverse items-start justify-between gap-3 mt-5 sm:flex-nowrap">
              <USelectCustom
                v-model="owner"
                :options="accounts"
                appearance="darken"
                text-attribute="login"
                name="owner"
                class="w-full min-w-0 lg:w-56"
              >
                <div class="flex items-center w-full min-w-0 gap-3">
                  <UAvatar :src="owner.avatar_url" size="xxs" class="flex-shrink-0" />
                  <span class="truncate">{{ owner.login }}</span>
                </div>

                <template #option="{ option }">
                  <div class="flex items-center w-full gap-3">
                    <UAvatar :src="option.avatar_url" size="xxs" class="flex-shrink-0" />
                    <span class="truncate">{{ option.login }}</span>
                  </div>
                </template>
              </USelectCustom>

              <UInput
                v-model="q"
                name="q"
                placeholder="Search repositories..."
                :loading="loading"
                icon="heroicons-outline:search"
                class="w-full sm:w-auto"
                custom-class="truncate"
                appearance="darken"
              />
            </div>
          </template>

          <div v-if="installations.length" class="divide-y u-divide-gray-200">
            <NuxtLink v-for="repository of repositories" :key="repository.id" class="flex items-center justify-between gap-3 py-3.5 px-4 sm:px-6 group hover:bg-gray-50 dark:hover:bg-black" :to="{ name: '@team-new-import', query: { repository: `${repository.owner.login}/${repository.name}` } }" tabindex="-1">
              <p class="flex items-center text-sm font-medium u-text-gray-900">
                <UIcon name="fa-brands:github" class="w-5 h-5 mr-3" />
                {{ repository.name }}
                <UIcon name="heroicons-outline:lock-closed" class="w-4 h-4 u-text-gray-400 ml-1.5" />
              </p>

              <UIcon
                name="heroicons-outline:chevron-right"
                class="invisible group-hover:visible u-text-gray-400 w-5 h-5 -mr-1.5"
              />
            </NuxtLink>
          </div>
          <p v-else class="px-4 py-5 u-text-gray-400 sm:p-6">
            It appears you haven't installed our GitHub app yet,
            <a :href="githubAppUrl" class="font-medium text-primary-500 hover:underline" target="_blank">
              select your repositories.
            </a>
          </p>

          <template #footer>
            <div class="flex items-center content-center justify-center gap-3">
              <div class="hidden sm:block">
                <p class="text-sm u-text-gray-700">
                  <span class="hidden lg:inline">Showing</span>
                  {{ ' ' }}
                  <span class="font-medium">{{ start }}</span>
                  {{ ' ' }}
                  to
                  {{ ' ' }}
                  <span class="font-medium">{{ end }}</span>
                  {{ ' ' }}
                  of
                  {{ ' ' }}
                  <span class="font-medium">{{ meta.total }}</span>
                  {{ ' ' }}
                  <span class="hidden lg:inline">results</span>
                </p>
              </div>
              <div class="flex-1 flex justify-between sm:justify-end gap-3 -my-0.5">
                <UButton
                  variant="secondary"
                  icon="heroicons-outline:chevron-left"
                  label="Prev"
                  size="sm"
                  :disabled="page <= 1"
                  @click="page = page - 1"
                />
                <UButton
                  variant="secondary"
                  icon="heroicons-outline:chevron-right"
                  label="Next"
                  size="sm"
                  trailing
                  :disabled="page * meta.limit >= meta.total"
                  @click="page = page + 1"
                />
              </div>
            </div>
          </template>
        </UCard>

        <UCard
          padded
          shadow-class=""
          base-class="flex flex-col overflow-hidden lg:h-[calc(100vh-352px)] lg:min-h-[528px]"
          body-class="px-4 pt-1 pb-6 sm:px-5"
          body-background-class="flex-1 lg:overflow-y-auto u-bg-gray-50"
          header-background-class="u-bg-gray-50 !border-0 -mb-1"
        >
          <template #header>
            <div class="flex items-center justify-between min-w-0 gap-3">
              <h3 class="text-2xl font-semibold truncate u-text-gray-900">
                Clone a template
              </h3>
            </div>
          </template>

          <div class="grid gap-6 lg:grid-cols-2">
            <TemplatesCard
              v-for="(template, index) of templates.slice(0, 4)"
              :key="index"
              :template="template"
              :to="{ name: '@team-new-clone', query: { template: template.slug } }"
              minimal
            />
          </div>
        </UCard>
      </div>
    </TeamPage>
  </div>
</template>

<script setup lang="ts">
import { debouncedWatch, useDocumentVisibility } from '@vueuse/core'
import type { PropType, Ref } from 'vue'
import type { Team, Template, GitHubInstallation, GitHubAccount, GitHubRepository, GitHubPagination, GitHubPaginationMeta } from '~/types'

defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  templates: {
    type: Array as PropType<Template[]>,
    default: () => []
  }
})

const client = useStrapiClient()
const visibility = useDocumentVisibility()
const { githubAppUrl } = useGitHub()

const q = ref('')
const page = ref(1)
const owner = ref(null)
const loading = ref(false)

const meta: GitHubPaginationMeta = reactive({
  total: 0,
  limit: 12
})

const start = computed(() => {
  return meta.total === 0 ? 0 : page.value * meta.limit - meta.limit || 1
})

const end = computed(() => {
  const end = page.value * meta.limit
  return end > meta.total ? meta.total : end
})

const { data: installations, refresh: refreshInstallations } = await useAsyncData('installations', () => client<GitHubInstallation[]>('/github/installations'))

const accounts: Ref<GitHubAccount[]> = ref([])
const repositories: Ref<GitHubRepository[]> = ref([])

watch(installations, () => {
  accounts.value = installations.value.map(({ account }) => account)

  page.value = 1
  if (owner.value) {
    owner.value = accounts.value.find(account => account.login === owner.value.login)
  } else {
    owner.value = accounts.value[0]
  }
}, { immediate: true })

const fetchRepositories = async () => {
  if (!owner.value) {
    return
  }

  loading.value = true

  try {
    const data = await client<GitHubPagination<GitHubRepository>>(`/github/installations/${owner.value.login}/repositories`, {
      params: {
        q: q.value,
        page: page.value,
        limit: 12
      }
    })

    repositories.value = data.data
    meta.total = data.meta.total
    meta.limit = data.meta.limit
  } catch (e) {}

  loading.value = false
}

onMounted(() => {
  fetchRepositories()

  watch(owner, () => {
    page.value = 1
    fetchRepositories()
  })
  watch(page, () => {
    fetchRepositories()
  })
  debouncedWatch(q, async () => {
    await fetchRepositories()
    page.value = 1
  }, { debounce: 500 })
})

watch(visibility, (current, previous) => {
  if (current === 'visible' && previous === 'hidden') {
    refreshInstallations()
  }
})
</script>
