<template>
  <UFooter
    :ui="{
      bottom: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: '!py-6' },
      top: { wrapper: 'border-t border-gray-200 dark:border-gray-800', container: 'py-8 lg:py-12' }
    }"
  >
    <template #top>
      <UFooterColumns :links="links">
        <template #right>
          <NewsletterForm />
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Copyright © 2016-{{ new Date().getFullYear() }} Nuxt - MIT License
      </p>
    </template>

    <template #right>
      <USocialButton to="https://x.com/nuxt_js" icon="i-simple-icons-x" />
      <USocialButton to="https://discord.com/invite/ps2h6QT" icon="i-simple-icons-discord" />
      <USocialButton to="https://github.com/nuxt/nuxt" icon="i-simple-icons-github" />
    </template>
  </UFooter>
</template>

<script setup lang="ts">
const links = [{
  label: 'Community',
  children: [{
    label: 'Nuxters',
    to: 'https://nuxters.nuxt.com',
    target: '_blank'
  }, {
    label: 'Video Courses',
    to: 'https://masteringnuxt.com/nuxt3?ref=nuxt',
    target: '_blank'
  }, {
    label: 'Nuxt on GitHub',
    to: 'https://github.com/nuxt',
    target: '_blank'
  }, {
    label: 'Design Kit',
    to: '/design-kit'
  }]
}, {
  label: 'Enterprise',
  children: [{
    label: 'Support',
    to: '/enterprise/support'
  }, {
    label: 'Agencies',
    to: '/enterprise/agencies'
  }, {
    label: 'Jobs',
    to: '/enterprise/jobs'
  }, {
    label: 'Sponsors',
    to: '/enterprise/sponsors'
  }]
}, {
  label: 'Solutions',
  children: [{
    label: 'Nuxt Content',
    to: 'https://content.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt Devtools',
    to: 'https://devtools.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt Image',
    to: 'https://image.nuxt.com/',
    target: '_blank'
  }, {
    label: 'Nuxt UI',
    to: 'https://ui.nuxt.com/',
    target: '_blank'
  }]
}]
</script>
