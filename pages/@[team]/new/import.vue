<template>
  <div class="flex flex-col flex-1">
    <PageHeader
      title="You're almost done."
      description="Please follow the steps to configure your project."
      :to="{ name: '@team-new' }"
    />

    <Page overlap>
      <PageGrid>
        <template #aside>
          <UCard v-if="repository" padded class="mb-6">
            <a :href="`https://github.com/${repository.owner.login}/${repository.name}`" target="_blank" class="flex items-center block gap-3">
              <UIcon name="fa-brands:github" class="w-5 h-5" />
              <p class="font-medium truncate">
                {{ repository.name }}
              </p>
            </a>
          </UCard>

          <NuxtLink :to="{ name: 'templates' }" class="text-sm font-medium text-primary-500 hover:underline">
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

          <div class="space-y-6">
            <UFormGroup name="slug" label="Slug" :help="form.slug !== slug ? `Your project slug will be renamed to “${slug}”` : 'This is your project\'s URL namespace on Nuxt.'" required class="relative w-full lg:max-w-md">
              <div class="flex items-center">
                <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 rounded-l-lg u-bg-gray-50 u-border-gray-200 u-text-gray-500">
                  nuxt.com/@{{ team?.slug || user.username }}/
                </span>

                <UInput
                  v-model="form.slug"
                  name="slug"
                  required
                  placeholder="framework"
                  autocomplete="off"
                  class="w-full"
                  appearance="darken"
                  custom-class="rounded-l-none"
                />
              </div>
            </UFormGroup>

            <UFormGroup name="name" label="Name" help="This is your project's visible name within Nuxt." required>
              <UInput
                v-model="form.name"
                name="name"
                required
                placeholder="Framework"
                autocomplete="off"
                appearance="darken"
                class="w-full lg:max-w-xs"
              />
            </UFormGroup>

            <UFormGroup name="url" label="Url" help="The url of your project is used for preview purposes.">
              <UInput
                v-model="form.url"
                name="url"
                class="w-full lg:max-w-xs"
                placeholder="https://nuxtjs.org"
                appearance="darken"
              />
            </UFormGroup>

            <UFormGroup name="baseDir" label="Base Directory" help="This is the path of your nuxt app in the repository.">
              <USelect
                v-model="form.baseDir"
                name="baseDir"
                class="w-full lg:max-w-xs"
                appearance="darken"
                :options="folders"
              />
            </UFormGroup>
          </div>

          <template #footer>
            <div class="flex items-center justify-end">
              <UButton
                type="submit"
                :loading="loading"
                label="Create"
              />
            </div>
          </template>
        </UCard>
      </PageGrid>
    </Page>
  </div>
</template>

<script setup lang="ts">
import slugify from '@sindresorhus/slugify'
import type { PropType, Ref } from 'vue'
import type { Team, Template, Project, User, GitHubRepository, File } from '~/types'

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
  await navigateTo({ name: '@team-new' })
}

const [owner, name] = (route.query.repository as string).split('/')

const { error, data: repository } = await useAsyncData<GitHubRepository>(
  'repository',
  () => client(`/github/installations/${owner}/${name}`),
  {
    pick: ['name', 'homepage', 'owner']
  }
)
if (error.value) {
  await navigateTo({ name: '@team-new' })
}

const { data: folders } = await useAsyncData(`import-${route.query.repository}-folders`, () => client<File[]>(`/github/installations/${owner}/${name}/folders`), {
  transform: (value) => {
    return value?.map(folder => ({ text: folder.path, value: folder.path }) || [])
  }
})

const loading = ref(false)
const form = reactive({ slug: name, name, url: repository.value.homepage, baseDir: '.' })

const slug = computed(() => {
  return slugify(form.slug)
})

const onSubmit = async () => {
  loading.value = true

  try {
    const project = await client<Project>('/projects/import', {
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

    router.push({ name: '@team-project', params: { team: props.team?.slug || user.value.username, project: project.slug } })
  } catch (e) {}

  loading.value = false
}
</script>
