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
          <h3 class="mb-2 text-lg font-medium leading-6 u-text-gray-900">
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

            <hr class="my-6 border-tw-gray-200">

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
import type { PropType } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
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
const client = useStrapiClient()
const visibility = useDocumentVisibility()
const { githubAppUrl } = useGitHub()

if (!route.query.template) {
  router.push({ name: 'team-new' })
}

const { data: installations, refresh: refreshInstallations } = await useAsyncData('installations', () => client<Installation[]>('/github/installations'))

watch(visibility, (current, previous) => {
  if (current === 'visible' && previous === 'hidden') {
    refreshInstallations()
  }
})

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
