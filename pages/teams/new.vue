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
        <div class="w-full lg:w-2/3 space-y-6">
          <UCard variant="black" ring-class="ring-1 u-ring-gray-200" border-color-class="u-border-gray-200" @submit="onSubmit">
            <div class="space-y-6">
              <UFormGroup name="slug" label="Slug" :help="form.slug !== slug ? `Your team slug will be renamed to “${slug}”` : 'This is your team\'s URL namespace on Nuxt.'" required class="relative">
                <div class="flex items-center">
                  <span class="u-bg-gray-50 border border-r-0 u-border-gray-300 rounded-l-md px-2 inline-flex items-center u-textgray-500 text-sm py-2">
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
                  <!-- TOFIX: Waiting for Avatar fix in @nuxthq/ui -->
                  <!-- <UAvatar :src="avatar" gradient /> -->

                  <input ref="file" name="avatar" type="file" class="hidden" @change="onFileUpload">

                  <UButton label="Change" size="sm" variant="white" @click="$refs.file.click()" />
                </div>
              </UFormGroup>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <p class="u-text-gray-500 text-sm">
                  <!-- Continuing will initiate a 14 day trial of the <NuxtLink to="/pricing" class="text-primary-500 hover:underline font-medium">
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
import omit from 'lodash/omit'
import slugify from '@sindresorhus/slugify'

// definePageMeta({
//   middleware: 'auth'
// })

const router = useRouter()
const { create } = useStrapi4()
const user = useStrapiUser()

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

    const team = await create('teams', formData)

    user.value.teams.push(team)

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
