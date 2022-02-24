<template>
  <div>
    <PageHeader
      title="You're almost done."
      description="Please follow the steps to configure your project."
      :to="{ name: '@team-new' }"
    />

    <Page overlap>
      <PageGrid>
        <template #aside>
          <UCard v-if="repository" class="mb-6">
            <a :href="`https://github.com/${repository.owner.login}/${repository.name}`" target="_blank" class="block flex items-center gap-3">
              <UIcon name="fa-brands:github" class="h-5 w-5" />
              <p class="font-medium truncate">
                {{ repository.name }}
              </p>
            </a>
          </UCard>

          <NuxtLink :to="{ name: '@team-new-templates' }" class="font-medium text-sm text-primary-500 hover:underline">
            Browse templates &rarr;
          </NuxtLink>
        </template>

        <UCard @submit.prevent="onSubmit">
          <h3 class="mb-1 text-lg font-medium leading-6 u-text-gray-900">
            Configure your project
          </h3>
          <p class="u-text-gray-500">
            Just choose a name for your project, it will be deployed using {{ `${repository.owner.login}/${repository.name}` }} repository if you haven't done it manually.
          </p>

          <hr class="my-6 u-border-gray-200">

          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-6 lg:flex-row">
              <UFormGroup name="name" label="Name" :help="form.name !== nameSlugified ? `Your project name will be renamed to “${nameSlugified}”` : 'This is your project\'s URL namespace on Nuxt.'" required class="relative w-full lg:max-w-lg">
                <div class="flex items-center">
                  <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
                    nuxt.com/@{{ team?.slug || user.username }}/
                  </span>

                  <UInput
                    v-model="form.name"
                    name="name"
                    required
                    autocomplete="off"
                    custom-class="rounded-l-none"
                  />
                </div>
              </UFormGroup>
            </div>

            <div class="flex items-center justify-end">
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
import slugify from '@sindresorhus/slugify'
import type { PropType, Ref } from 'vue'
import type { Team, Template, Project, User, GitHubRepository } from '~/types'

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

if (!route.query.repository) {
  router.push({ name: '@team-new' })
}

const loading = ref(false)
const [owner, name] = (route.query.repository as string).split('/')

const { error, data: repository } = await useAsyncData<GitHubRepository>(
  'repository',
  () => client(`/github/installations/${owner}/${name}`),
  {
    pick: ['name', 'owner']
  }
)
if (error.value) {
  router.push({ name: '@team-new' })
}

const form = reactive({ name })

const nameSlugified = computed(() => {
  return slugify(form.name)
})

const onSubmit = async () => {
  loading.value = true

  try {
    await client<Project>('/projects/import', {
      method: 'POST',
      body: {
        ...form,
        repository: {
          owner: repository.value.owner.login,
          name: repository.value.name
        },
        team: props.team?.slug
      }
    })

    router.push({ name: '@team', params: { team: props.team?.slug || user.value.username } })
  } catch (e) {}

  loading.value = false
}
</script>
