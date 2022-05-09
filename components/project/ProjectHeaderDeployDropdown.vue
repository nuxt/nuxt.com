<template>
  <UDropdown :items="deployOptions">
    <UButton label="Deploy" size="xs" icon="heroicons-outline:chevron-down" trailing />
  </UDropdown>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

const project: Project = inject('project')

const deployOptions = computed(() => ([[
  {
    icon: 'logos:vercel-icon',
    label: 'Deploy to Vercel',
    to: `https://vercel.com/new/clone?repository-url=${encodeURIComponent(`https://github.com/${project.repository.owner}/${project.repository.name}`)}`,
    target: '_blank'
  },
  {
    icon: 'logos:netlify',
    label: 'Deploy to Netlify',
    to: `https://app.netlify.com/start/deploy?repository=https://github.com/${project.repository.owner}/${project.repository.name}`,
    target: '_blank'
  }
]]))
</script>
