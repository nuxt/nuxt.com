<template>
  <div class="flex flex-col gap-y-8 py-20 not-prose">
    <h1 class="u-text-gray-900 text-4xl font-semibold text-left">
      <Markdown use="title" unwrap="p" />
    </h1>
    <p class="w-full lg:w-1/2 text-lg u-text-gray-500 text-left">
      <Markdown use="description" unwrap="p" />
    </p>
    <Markdown use="content" unwrap="p" />
  </div>
</template>
