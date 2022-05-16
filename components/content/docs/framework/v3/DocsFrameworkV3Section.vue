<template>
  <div class="flex flex-col py-20 gap-y-8 not-prose">
    <h1 class="text-4xl font-semibold text-left u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h1>
    <p class="w-full text-lg text-left lg:w-1/2 u-text-gray-500">
      <Markdown use="description" unwrap="p" />
    </p>
    <Markdown use="content" unwrap="p" />
  </div>
</template>
