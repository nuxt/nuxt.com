<template>
  <div class="flex flex-col flex-1">
    <PageHeader title="Select a template." description="We support all your favorite frameworks without additional configuration." />

    <Page overlap>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
        <TemplatesCard
          v-for="(template, index) of templates"
          :key="index"
          :template="template"
          :to="user && { name: '@team-new-clone', query: { template: template.slug }, params: { team: user.username } }"
        />
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { Template, User } from '~/types'

const user = useStrapiUser() as Ref<User>
const { find } = useStrapi4()

const { data: templates } = await useAsyncData('templates', () => find<Template[]>('templates', { populate: 'screenshot' }))
</script>
