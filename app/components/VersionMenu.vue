<script setup lang="ts">
import { DOCS_REPO, getVersionByPath } from '#shared/utils/docs'

const { meta: docsMeta, version: docsVersion, items } = useDocsVersion()
const { tags } = useDocsTags()
const { track } = useAnalytics()
const route = useRoute()

const switchable = computed(() => !!getVersionByPath(route.path))

/** The version shown when it is released, so its notes are readable. */
const releasedVersion = computed(() => {
  const tag = tags.value[docsVersion.value]
  return /^\d+\.\d+\.\d+$/.test(tag ?? '') ? tag : undefined
})

const releaseNotesUrl = computed(() => releasedVersion.value && `https://github.com/${DOCS_REPO}/releases/tag/v${releasedVersion.value}`)

function trackReleaseNotes() {
  track('Header Action', { action: 'Release Notes' })
}
</script>

<template>
  <!-- Outside the versioned docs, the badge is not a dropdown: make it a link to the version's release notes. -->
  <UButton
    v-if="!switchable"
    :label="`v${tags[docsVersion]}`"
    variant="subtle"
    size="xs"
    :color="docsMeta.tagColor"
    :to="releaseNotesUrl"
    target="_blank"
    class="-mb-0.5 font-semibold text-[12px]/3 rounded-sm px-1.5 gap-0.5 truncate hover:bg-primary/10 active:bg-primary/10"
    @click="trackReleaseNotes"
  />
  <UDropdownMenu
    v-else
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      :label="`v${tags[docsVersion]}`"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      :color="docsMeta.tagColor"
      class="-mb-0.5 font-semibold text-[12px]/3 rounded-sm px-1.5 gap-0.5 truncate"
      :ui="{
        trailingIcon: ['transition-transform duration-200 size-3', open && 'rotate-180']
      }"
    />
  </UDropdownMenu>
</template>
