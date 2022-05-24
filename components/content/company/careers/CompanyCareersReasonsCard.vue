<template>
  <li>
    <h3 class="text-xl font-semibold u-text-gray-900">
      <Markdown :use="$slots.title" unwrap="p" />
    </h3>
    <p class="mt-3 text-base">
      <Markdown :use="$slots.description" unwrap="p" />
    </p>
  </li>
</template>
