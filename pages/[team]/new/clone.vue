<template>
  <div>
    <PageHeader
      title="You're almost done."
      description="Please follow the steps to configure your project and deploy it."
      :to="{ name: 'team-new' }"
    />

    <Page overlap>
      <PageGrid v-if="selectedTemplate">
        <template #aside>
          <TemplateCard :template="selectedTemplate" />
        </template>

        <UCard @submit="onSubmit">
          <template #header>
            <h3 class="text-lg font-medium leading-6 u-text-gray-900">
              Create a git repository
            </h3>
          </template>

          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-6 lg:flex-row">
              <UFormGroup name="owner" label="Owner" required class="relative w-full lg:w-56">
                <UInput v-model="form.owner" name="owner" required />
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
        </UCard>
      </PageGrid>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { Template, Project, Installation } from '~/types'

const props = defineProps({
  templates: {
    type: Array as PropType<Template[]>,
    default: () => []
  }
})

const route = useRoute()
const router = useRouter()
const { create } = useStrapi4()
// const client = useStrapiClient()

if (!route.query.template) {
  router.push({ name: 'team-new' })
}

// const { data: installations } = await useAsyncData('installations', () => client<Installation[]>('/github/installations'))
const installations = [
  {
    id: 19089756,
    account: {
      login: 'benjamincanac',
      id: 739984,
      node_id: 'MDQ6VXNlcjczOTk4NA==',
      avatar_url: 'https://avatars.githubusercontent.com/u/739984?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/benjamincanac',
      html_url: 'https://github.com/benjamincanac',
      followers_url: 'https://api.github.com/users/benjamincanac/followers',
      following_url: 'https://api.github.com/users/benjamincanac/following{/other_user}',
      gists_url: 'https://api.github.com/users/benjamincanac/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/benjamincanac/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/benjamincanac/subscriptions',
      organizations_url: 'https://api.github.com/users/benjamincanac/orgs',
      repos_url: 'https://api.github.com/users/benjamincanac/repos',
      events_url: 'https://api.github.com/users/benjamincanac/events{/privacy}',
      received_events_url: 'https://api.github.com/users/benjamincanac/received_events',
      type: 'User',
      site_admin: false
    },
    repository_selection: 'all',
    access_tokens_url: 'https://api.github.com/app/installations/19089756/access_tokens',
    repositories_url: 'https://api.github.com/installation/repositories',
    html_url: 'https://github.com/settings/installations/19089756',
    app_id: 131223,
    app_slug: 'dev-docus',
    target_id: 739984,
    target_type: 'User',
    permissions: {
      pages: 'write',
      actions: 'write',
      secrets: 'write',
      contents: 'write',
      metadata: 'read',
      workflows: 'write',
      administration: 'write'
    },
    events: [
      'create',
      'delete',
      'member',
      'organization',
      'push',
      'repository',
      'workflow_run'
    ],
    created_at: '2021-08-26T15:24:34.000+02:00',
    updated_at: '2022-02-10T15:20:55.000+01:00',
    single_file_name: null,
    has_multiple_single_files: false,
    single_file_paths: [],
    suspended_by: null,
    suspended_at: null
  },
  {
    id: 20070296,
    account: {
      login: 'nuxtlabs',
      id: 62017400,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjYyMDE3NDAw',
      avatar_url: 'https://avatars.githubusercontent.com/u/62017400?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/nuxtlabs',
      html_url: 'https://github.com/nuxtlabs',
      followers_url: 'https://api.github.com/users/nuxtlabs/followers',
      following_url: 'https://api.github.com/users/nuxtlabs/following{/other_user}',
      gists_url: 'https://api.github.com/users/nuxtlabs/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/nuxtlabs/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/nuxtlabs/subscriptions',
      organizations_url: 'https://api.github.com/users/nuxtlabs/orgs',
      repos_url: 'https://api.github.com/users/nuxtlabs/repos',
      events_url: 'https://api.github.com/users/nuxtlabs/events{/privacy}',
      received_events_url: 'https://api.github.com/users/nuxtlabs/received_events',
      type: 'Organization',
      site_admin: false
    },
    repository_selection: 'all',
    access_tokens_url: 'https://api.github.com/app/installations/20070296/access_tokens',
    repositories_url: 'https://api.github.com/installation/repositories',
    html_url: 'https://github.com/organizations/nuxtlabs/settings/installations/20070296',
    app_id: 131223,
    app_slug: 'dev-docus',
    target_id: 62017400,
    target_type: 'Organization',
    permissions: {
      pages: 'write',
      actions: 'write',
      members: 'read',
      secrets: 'write',
      contents: 'write',
      metadata: 'read',
      workflows: 'write',
      administration: 'write'
    },
    events: [
      'create',
      'delete',
      'member',
      'organization',
      'push',
      'repository',
      'workflow_run'
    ],
    created_at: '2021-10-13T12:28:50.000+02:00',
    updated_at: '2022-01-31T15:40:30.000+01:00',
    single_file_name: null,
    has_multiple_single_files: false,
    single_file_paths: [],
    suspended_by: null,
    suspended_at: null
  },
  {
    id: 18930551,
    account: {
      login: 'docusgen',
      id: 86603667,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjg2NjAzNjY3',
      avatar_url: 'https://avatars.githubusercontent.com/u/86603667?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/docusgen',
      html_url: 'https://github.com/docusgen',
      followers_url: 'https://api.github.com/users/docusgen/followers',
      following_url: 'https://api.github.com/users/docusgen/following{/other_user}',
      gists_url: 'https://api.github.com/users/docusgen/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/docusgen/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/docusgen/subscriptions',
      organizations_url: 'https://api.github.com/users/docusgen/orgs',
      repos_url: 'https://api.github.com/users/docusgen/repos',
      events_url: 'https://api.github.com/users/docusgen/events{/privacy}',
      received_events_url: 'https://api.github.com/users/docusgen/received_events',
      type: 'Organization',
      site_admin: false
    },
    repository_selection: 'all',
    access_tokens_url: 'https://api.github.com/app/installations/18930551/access_tokens',
    repositories_url: 'https://api.github.com/installation/repositories',
    html_url: 'https://github.com/organizations/docusgen/settings/installations/18930551',
    app_id: 131223,
    app_slug: 'dev-docus',
    target_id: 86603667,
    target_type: 'Organization',
    permissions: {
      pages: 'write',
      actions: 'write',
      members: 'read',
      secrets: 'write',
      contents: 'write',
      metadata: 'read',
      workflows: 'write',
      administration: 'write'
    },
    events: [
      'create',
      'delete',
      'member',
      'organization',
      'push',
      'repository',
      'workflow_run'
    ],
    created_at: '2021-08-18T12:51:37.000+02:00',
    updated_at: '2022-01-26T19:54:59.000+01:00',
    single_file_name: null,
    has_multiple_single_files: false,
    single_file_paths: [],
    suspended_by: null,
    suspended_at: null
  }
]

const loading = ref(false)
const form = reactive({
  owner: '',
  name: '',
  private: false
})

const selectedTemplate = computed(() => props.templates.find(template => template.slug === route.query.template))

const onSubmit = async () => {
  loading.value = true

  try {
    await create<Project>('projects', {
      ...form,
      template: selectedTemplate.value.id
    })
  } catch (e) {}

  loading.value = false
}
</script>
