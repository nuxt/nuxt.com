<template>
  <div>
    <PageHeader title="Import an existing project">
      <template #description>
        Select a GitHub repository or
        <NuxtLink :to="`/${team?.slug || 'dashboard'}/new`" class="text-primary-500 hover:underline">
          use one of our templates.
        </NuxtLink>
      </template>
    </PageHeader>

    <Page overlap>
      <UCard base-class="overflow-hidden lg:h-[calc(100vh-352px)] flex flex-col" body-class="flex-1 lg:overflow-y-auto" footer-background-class="u-bg-gray-50">
        <template #header>
          <div class="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div class="flex flex-wrap items-center gap-3">
              <USelectCustom v-model="owner" :options="accounts" text-attribute="login" name="owner" class="w-full sm:w-52">
                <div class="flex items-center gap-3 w-full">
                  <UAvatar :src="owner.avatar_url" size="xxs" class="flex-shrink-0" />
                  <span class="truncate">{{ owner.login }}</span>
                </div>

                <template #option="{ option }">
                  <div class="flex items-center gap-3 w-full">
                    <UAvatar :src="option.avatar_url" size="xxs" class="flex-shrink-0" />
                    <span class="truncate">{{ option.login }}</span>
                  </div>
                </template>
              </USelectCustom>

              <p class="text-sm u-text-gray-500">
                Missing some repositories? <a :href="githubAppUrl" class="font-medium text-primary-500 hover:underline" target="_blank">Add GitHub account →</a>
              </p>
            </div>

            <UInput
              v-model="q"
              name="q"
              placeholder="Search repositories..."
              icon="heroicons-outline:search"
              class="w-full sm:w-auto"
            />
          </div>
        </template>

        <ul class="divide-y u-divide-gray-200">
          <li v-for="repository of repositories" :key="repository.id" class="flex items-center justify-between gap-3 py-3.5 px-4 sm:px-6 group hover:u-bg-gray-50">
            <p class="text-sm font-medium u-text-gray-900 flex items-center gap-3">
              <UIcon name="fa-brands:github" class="h-5 w-5" />
              {{ repository.name }}
              <span class="flex items-center u-text-gray-500 text-xs gap-1 tracking-tight font-medium"><UIcon name="heroicons-outline:lock-closed" class="w-4 h-4" /> Private</span>
            </p>

            <UButton
              size="xs"
              label="Import"
              icon="heroicons-solid:arrow-sm-right"
              trailing
              class="-my-2 invisible group-hover:visible"
              @click="onClick(repository)"
            />
          </li>
        </ul>

        <template #footer>
          <div class="flex items-center justify-center content-center gap-3">
            <div class="hidden sm:block">
              <p class="text-sm u-text-gray-700">
                Showing
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
                results
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
    </Page>
  </div>
</template>

<script setup lang="ts">
import { debouncedWatch, useDocumentVisibility } from '@vueuse/core'
import type { PropType, Ref } from 'vue'
import type { Team, Project, GitHubInstallation, GitHubAccount, GitHubRepository, GitHubPagination, GitHubPaginationMeta } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const router = useRouter()
const client = useStrapiClient()
const visibility = useDocumentVisibility()
const { githubAppUrl } = useGitHub()

const q = ref('')
const page = ref(1)
const owner = ref(null)

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

const loading = ref(false)

const onClick = async (repository) => {
  loading.value = true

  try {
    await client<Project>('/projects/import', {
      method: 'POST',
      body: {
        repository: {
          owner: repository.owner.login,
          name: repository.name
        },
        team: props.team?.slug
      }
    })

    router.push({ name: 'team', params: { team: props.team?.slug || 'dashboard' } })
  } catch (e) {}

  loading.value = false
}
</script>
