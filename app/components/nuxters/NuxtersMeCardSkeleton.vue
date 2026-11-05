<!--
  The signed-in card while it loads: same card, same rows and the same minimum height as
  NuxtersMeCard, so the hero does not move when the session or the stats arrive.
-->
<script setup lang="ts">
import { NUXTERS_ME_CARD_CLASS } from '~/utils/nuxters-me-card'
</script>

<template>
  <UPageCard variant="subtle" :class="NUXTERS_ME_CARD_CLASS">
    <div class="flex flex-col gap-6" aria-hidden="true">
      <div class="flex items-center gap-4">
        <USkeleton class="size-16 rounded-full shrink-0" />
        <div class="flex flex-col gap-2 flex-1">
          <USkeleton class="h-5 w-40" />
          <USkeleton class="h-4 w-28" />
          <USkeleton class="h-4 w-36" />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <USkeleton v-for="row in 3" :key="row" class="h-6 w-56" />
      </div>
      <USkeleton class="h-6 w-32" />
      <div class="flex gap-2 pt-4 border-t border-default">
        <USkeleton class="h-8 w-44" />
        <USkeleton class="h-8 w-36" />
      </div>
    </div>
  </UPageCard>
</template>
