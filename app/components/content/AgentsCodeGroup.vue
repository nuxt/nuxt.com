<script setup lang="ts">
import { ProseCodeGroup } from '#components'

/**
 * `ProseCodeGroup` for the `/agents` page, styled like `AgentsProsePre`: one box with mono file
 * tabs in the header. On narrow screens the tabs scroll under a solid strip at the end,
 * so they never run beneath the copy button.
 */
</script>

<template>
  <ProseCodeGroup
    :ui="{
      root: 'my-0 [&_pre]:rounded-t-none',
      list: [
        'gap-0.5 p-1 ps-1.5 rounded-t-xl border-default bg-(--agents-code-bg,var(--ui-bg-elevated))',
        'after:content-[\'\'] after:sticky after:-end-1 after:-my-1 after:-me-1 after:ms-auto after:self-stretch after:shrink-0 after:w-12 after:bg-(--agents-code-bg,var(--ui-bg-elevated))'
      ].join(' '),
      indicator: 'inset-y-1 rounded-md bg-accented shadow-none',
      trigger: 'min-h-9 px-2.5 gap-2 rounded-md font-mono text-[13px] font-medium text-muted data-[state=active]:text-highlighted hover:bg-transparent hover:text-highlighted',
      triggerIcon: 'size-3.5'
    }"
  >
    <slot />
  </ProseCodeGroup>
</template>
