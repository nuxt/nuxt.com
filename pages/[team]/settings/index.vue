<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-medium leading-6 u-text-gray-900">
        General
      </h2>
      <p class="mt-1 text-sm u-text-gray-400">
        Update your team informations.
      </p>
    </template>

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
      <div class="flex items-center justify-end">
        <UButton
          type="submit"
          :loading="loading"
          label="Save"
          @click="onSubmit()"
        />
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { omit } from 'lodash-es'
import slugify from '@sindresorhus/slugify'
import type { PropType, Ref } from 'vue'
import { nextTick } from 'vue'
import type { Team, User } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const props = defineProps({
  team: {
    type: Object as PropType<Team>,
    default: null
  }
})

const client = useStrapiClient()
const user = useStrapiUser() as Ref<User>
const avatar = ref(props.team.avatar?.url)
const file = ref(null)
const form = reactive({ name: props.team.name, slug: props.team.slug, avatar: '' })
const loading = ref(false)
const { $toast } = useNuxtApp()

watch(() => form.slug, () => {
  const newSlug = slugify(form.slug)
  if (newSlug !== form.slug) {
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

    const userTeam = await client<Team>(`/teams/${props.team.id}`, {
      method: 'PUT',
      body: formData
    })

    // update user team
    const team = user.value?.teams?.find(team => team.id === userTeam.id)
    if (team) {
      Object.assign(team, userTeam)
    }

    setTimeout(() => {
      $toast.success({
        title: 'Success',
        description: 'Your team settings have been saved.'
      })
    }, 2000)
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
