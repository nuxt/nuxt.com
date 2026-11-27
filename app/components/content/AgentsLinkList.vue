<template>
  <!-- A markdown list of links, rendered as a grid of boxed links. -->
  <div
    class="not-prose
      [&_ul]:m-0! [&_ul]:p-0! [&_ul]:list-none! [&_ul]:grid [&_ul]:grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] [&_ul]:gap-2
      [&_li]:m-0! [&_li]:ps-0! [&_li]:before:hidden
      [&_a]:flex [&_a]:items-center [&_a]:justify-between [&_a]:gap-3 [&_a]:min-h-12 [&_a]:px-3.5 [&_a]:rounded-[10px] [&_a]:border! [&_a]:border-default! [&_a]:bg-default [&_a]:whitespace-nowrap [&_a]:transition-colors [&_a]:hover:border-accented!
      [&_a_code]:border-0! [&_a_code]:bg-transparent! [&_a_code]:p-0! [&_a_code]:font-mono [&_a_code]:text-sm [&_a_code]:font-medium [&_a_code]:text-primary!
      [&_a]:after:content-['↗'] [&_a]:after:text-xs [&_a]:after:text-muted"
  >
    <slot />
  </div>
</template>
