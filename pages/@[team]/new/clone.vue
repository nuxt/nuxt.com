<template>
  <div>
    <PageHeader
      title="You're almost done."
      description="Please follow the steps to configure your project."
      :to="{ name: '@team-new' }"
    />

    <Page overlap>
      <PageGrid v-if="selectedTemplate">
        <template #aside>
          <TemplatesItem :template="selectedTemplate" />
        </template>

        <UCard base-class @submit.prevent="onSubmit">
          <h3 class="mb-1 text-lg font-medium leading-6 u-text-gray-900">
            Create a Git repository
          </h3>

          <div v-if="installations.length">
            <p class="u-text-gray-500">
              To ensure you can easily update your project after deploying it, a Git repository must be created. You can
              <a :href="githubAppUrl" class="font-medium text-primary-500 hover:underline" target="_blank">
                install our GitHub app
              </a>
              to access all your organizations.
            </p>

            <hr class="my-6 u-border-gray-200">

            <div class="flex flex-col gap-6">
              <div class="flex flex-col items-center gap-6 lg:flex-row">
                <UFormGroup name="owner" label="Owner" required class="relative w-full lg:w-56">
                  <USelectCustom v-model="form.owner" :options="accounts" text-attribute="login" name="owner" required>
                    <div class="flex items-center gap-3">
                      <UAvatar :src="form.owner.avatar_url" size="xxs" />
                      {{ form.owner.login }}
                    </div>

                    <template #option="{ option }">
                      <div class="flex items-center gap-3">
                        <UAvatar :src="option.avatar_url" size="xxs" />
                        {{ option.login }}
                      </div>
                    </template>
                  </USelectCustom>
                </UFormGroup>

                <UFormGroup name="name" label="Name" required class="relative w-full lg:w-56">
                  <UInput v-model="form.name" name="name" required />
                </UFormGroup>
              </div>

              <div class="flex items-center justify-between">
                <UCheckbox v-model="form.private" name="private" label="Private repository" />

                <UButton
                  type="submit"
                  :loading="loading"
                  label="Create"
                />
              </div>
            </div>
          </div>

          <div v-else>
            <p class="u-text-gray-400">
              It appears you haven't installed our GitHub app yet,
              <a :href="githubAppUrl" class="font-medium text-primary-500 hover:underline" target="_blank">
                select your repositories.
              </a>
            </p>
          </div>
        </UCard>
      </PageGrid>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType, Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import type { Team, Template, Project, User, GitHubInstallation, GitHubAccount } from '~/types'

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  },
  templates: {
    type: Array as PropType<Template[]>,
    default: () => []
  }
})

const user = useStrapiUser() as Ref<User>
const route = useRoute()
const router = useRouter()
const client = useStrapiClient()
const visibility = useDocumentVisibility()
const { githubAppUrl } = useGitHub()

if (!route.query.template) {
  router.push({ name: '@team-new' })
}

const accounts: Ref<GitHubAccount[]> = ref([])
const { data: installations, refresh: refreshInstallations } = await useAsyncData('installations', () => client<GitHubInstallation[]>('/github/installations'))

watch(visibility, (current, previous) => {
  if (current === 'visible' && previous === 'hidden') {
    refreshInstallations()
  }
})

const loading = ref(false)
const form = reactive({
  owner: null,
  name: '',
  private: false
})

watchEffect(() => {
  accounts.value = installations.value.map(({ account }) => account)

  if (form.owner) {
    form.owner = accounts.value.find(account => account.login === form.owner.login)
  } else {
    form.owner = accounts.value[0]
  }
})

const selectedTemplate = computed(() => props.templates.find(template => template.slug === route.query.template))

const onSubmit = async () => {
  loading.value = true

  try {
    const project = await client<Project>('/projects/clone', {
      method: 'POST',
      body: {
        ...form,
        team: props.team?.slug,
        template: selectedTemplate.value.id
      }
    })

    router.push({ name: '@team-project', params: { team: props.team?.slug || user.value.username, project: project.name } })
  } catch (e) {}

  loading.value = false
}
</script>
