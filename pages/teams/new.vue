<template>
  <div>
    <div class="bg-white dark:bg-black">
      <UContainer padded>
        <div class="py-16 sm:py-24">
          <h2 class="text-4xl font-extrabold u-text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Create a new team
          </h2>
          <p class="mt-5 text-xl u-text-gray-400">
            A Nuxt team will allow you to collaborate with others on your projects and enjoy additional optional features.
          </p>
        </div>
      </UContainer>
    </div>

    <Page>
      <div class="flex flex-col-reverse lg:flex-row gap-10 lg:mt-[-72.5px]">
        <div class="w-full space-y-6 lg:w-2/3">
          <UCard variant="black" ring-class="ring-1 u-ring-gray-200" border-color-class="u-border-gray-200" @submit.prevent="onSubmit">
            <div class="space-y-6">
              <UFormGroup name="slug" label="Slug" help="This is your team's URL namespace on Nuxt." required class="relative">
                <div class="flex items-center">
                  <span class="inline-flex items-center px-2 py-2 text-sm border border-r-0 u-bg-gray-50 u-border-gray-300 rounded-l-md u-textgray-500">
                    nuxt.com/
                  </span>

                  <UInput
                    v-model="form.slug"
                    name="slug"
                    required
                    autocomplete="off"
                    class="w-full lg:w-56"
                    placeholder="choam"
                    custom-class="rounded-l-none"
                  />
                </div>
              </UFormGroup>

              <UFormGroup name="name" label="Name" help="This is your team's visible name within Nuxt. For example, the name of your company or department." required>
                <UInput
                  v-model="form.name"
                  name="name"
                  required
                  placeholder="CHOAM"
                  autocomplete="off"
                  class="w-full lg:w-80"
                />
              </UFormGroup>

              <UFormGroup name="avatar" label="Avatar" help="An avatar is optional but strongly recommended.">
                <div class="flex items-center gap-3">
                  <UAvatar :src="avatar" gradient />

                  <input ref="file" name="avatar" type="file" class="hidden" @change="onFileUpload">

                  <UButton label="Change" size="sm" variant="white" @click="$refs.file.click()" />
                </div>
              </UFormGroup>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <p class="text-sm u-text-gray-500">
                  <!-- Continuing will initiate a 14 day trial of the <NuxtLink to="/pricing" class="font-medium text-primary-500 hover:underline">
                    Pro plan
                  </NuxtLink>. -->
                </p>

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
import { nextTick } from 'vue'
import type { Ref } from 'vue'
import type { Team, User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const router = useRouter()
const client = useStrapiClient()
const user = useStrapiUser() as Ref<User>

const file = ref(null)
const form = reactive({ name: '', slug: '', avatar: null })
const avatar = ref(null)
const loading = ref(false)

watch(() => form.slug, () => {
  const newSlug = slugify(form.slug)
  if (newSlug !== form.slug) {
    // nextTick to avoid no changes when pasting twice the same value
    nextTick(() => {
      form.slug = newSlug
    })
  }
})

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

    router.push(`/${team.slug}`)
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
