<template>
  <div>
    <Tabs />

    <Page>
      <PageGrid>
        <template #aside>
          <UVerticalNavigation :links="links" active-class="u-text-gray-900 u-bg-gray-200" />
        </template>

        <NuxtChild />
      </PageGrid>
    </Page>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const to = '/account'
const links = [{
  label: 'General',
  to,
  icon: 'heroicons-outline:cog',
  exact: true
}, {
  label: 'Login connections',
  to: `${to}/login-connections`,
  icon: 'heroicons-outline:link',
  exact: true
}, {
  label: 'Teams',
  to: `${to}/teams`,
  icon: 'heroicons-outline:user-group',
  exact: true
}]
</script>
