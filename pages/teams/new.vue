<template>
  <div class="flex flex-col flex-1">
    <PageHeader title="Create a new team" description="A Nuxt team will allow you to collaborate with others on your projects and enjoy additional optional features." />

    <Page overlap>
      <div class="flex flex-col-reverse gap-10 lg:flex-row">
        <div class="w-full space-y-6 lg:w-2/3">
          <UCard @submit.prevent="onSubmit">
            <div class="space-y-6">
              <UFormGroup name="slug" label="Slug" :help="form.slug !== slug ? `Your team slug will be renamed to “${slug}”` : 'This is your team\'s URL namespace on Nuxt.'" required class="relative w-full lg:max-w-xs">
                <div class="flex items-center">
                  <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
                    nuxt.com/@
                  </span>

                  <UInput
                    v-model="form.slug"
                    name="slug"
                    required
                    autocomplete="off"
                    class="w-full"
                    placeholder="nuxt"
                    custom-class="rounded-l-none"
                  />
                </div>
              </UFormGroup>

              <UFormGroup name="name" label="Name" help="This is your team's visible name within Nuxt. For example, the name of your company or department." required>
                <UInput
                  v-model="form.name"
                  name="name"
                  required
                  placeholder="Nuxt"
                  autocomplete="off"
                  class="w-full lg:max-w-xs"
                />
              </UFormGroup>

              <UFormGroup name="avatar" label="Avatar" help="An avatar is optional but strongly recommended.">
                <div class="flex items-center gap-3">
                  <UAvatar :src="avatar" gradient />

                  <input ref="file" name="avatar" type="file" class="hidden" @change="onFileUpload">

                  <UButton label="Change" size="sm" variant="secondary" @click="$refs.file.click()" />
                </div>
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
        </div>
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import { omit } from 'lodash-es'
import slugify from '@sindresorhus/slugify'
import type { Ref } from 'vue'
import type { Team, User } from '~/types'

definePageMeta({
  middleware: ['auth', 'beta']
})

const router = useRouter()
const client = useStrapiClient()
const user = useStrapiUser() as Ref<User>

const file = ref(null)
const form = reactive({ name: '', slug: '', avatar: null })
const avatar = ref(null)
const loading = ref(false)

const onSubmit = async () => {
  loading.value = true

  try {
    const formData = new FormData()
    if (form.avatar) { formData.append('files.avatar', form.avatar) }
    formData.append('data', JSON.stringify(omit(form, ['avatar'])))

    const team = await client<Team>('/teams', {
      method: 'POST',
      body: formData
    })

    user.value.memberships.push(...team.members.map(member => ({
      team,
      id: member.id,
      role: member.role
    })))

    router.push({ name: '@team-projects', params: { team: team.slug } })
  } catch (e) {}

  loading.value = false
}

const onFileUpload = () => {
  form.avatar = file.value.files[0]

  avatar.value = URL.createObjectURL(form.avatar)
}

const slug = computed(() => {
  return slugify(form.slug)
})
</script>
