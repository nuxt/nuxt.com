<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { Link } from '@ui-kit/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

defineProps<{
  links?: Link[]
}>()

const { mapContentNavigation } = useElementsHelpers()
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <LogoFull class="hidden w-auto h-6 sm:block" />
      <Logo class="block w-auto h-6 sm:hidden" />
    </template>

    <template #right>
      <UColorModeButton />

      <UButton
        icon="i-ph-star-duotone"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        label="46.6k"
        color="gray"
        variant="ghost"
      />
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" default-open :multiple="false" />

      <hr class="border-border border-dashed my-6">

      <div class="flex flex-col gap-y-4">
        <UButton
          to="https://github.com/nuxt/modules"
          color="gray"
          variant="link"
          label="Contribute on GitHub"
          icon="i-simple-icons-github"
          :padded="false"
        />
        <UButton
          to="/docs/guide/going-further/modules"
          color="gray"
          variant="link"
          label="Module Author guide"
          icon="i-ph-book-open"
          :padded="false"
        />
      </div>
    </template>
  </UHeader>
</template>
