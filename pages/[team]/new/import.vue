<template>
  <div>
    <PageHeader
      title="Import an existing project"
      description="From zero to hero, select your repository to get your site on Nuxt."
    />

    <Page overlap>
      <UCard>
        <div class="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
          <div class="ml-4 mt-4">
            <UDropdown :items="installations">
              <UButton variant="secondary" icon="heroicons-outline:chevron-down" trailing>
                <div class="flex items-center gap-3">
                  <UAvatar :src="installation.account.avatar_url" size="xxs" />
                  {{ installation.account.login }}
                </div>
              </UButton>

              <template #option="{ option }">
                <div class="flex items-center gap-3">
                  <UAvatar :src="option.account.avatar_url" size="xxs" />
                  {{ option.account.login }}
                </div>
              </template>
            </UDropdown>
          </div>
          <div class="ml-4 mt-4 flex-shrink-0">
            <UInput v-model="form.q" name="query" type="search" placeholder="Search repositories..." icon="heroicons-outline:search" />
          </div>
        </div>
      </UCard>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import type { Team, Project, GitHubInstallation, GitHubAccount } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const route = useRoute()
const router = useRouter()
const client = useStrapiClient()
const visibility = useDocumentVisibility()
const { githubAppUrl } = useGitHub()

const form = reactive({
  q: ''
})

const installation: Ref<GitHubInstallation> = ref(null)
const { data: installations, refresh: refreshInstallations } = await useAsyncData('installations', () => client<GitHubInstallation[]>('/github/installations'))

watchEffect(() => {
  installation.value = installations.value[0]
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
        ...repository,
        team: props.team?.slug
      }
    })

    router.push({ name: 'team', params: { team: props.team.slug || 'dashboard' } })
  } catch (e) {}

  loading.value = false
}
</script>
