<script setup lang="ts">
import { sampleIssues } from './agent/lib/sample-issues'
</script>

<template>
  <main>
    <header>
      <p class="eyebrow">
        Nuxt + eve
      </p>
      <h1>Issue triage</h1>
      <p class="subtitle">
        A decision model triages every issue. Only the unsure ones go to a reviewer agent.
      </p>
    </header>
    <Triage :issues="sampleIssues" />
  </main>
</template>
