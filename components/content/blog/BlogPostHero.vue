<template>
  <UContainer padded>
    <div class="grid gap-8 pt-12 pb-8 sm:py-12 lg:grid-cols-2">
      <div class="flex flex-col items-center justify-center sm:items-start gap-y-2 sm:gap-y-5">
        <h1 class="text-4xl font-semibold text-center sm:text-left u-text-gray-900 sm:text-5xl">
          <ContentSlot :use="$slots.title" unwrap="p" />
        </h1>
        <p v-if="$slots.description" class="text-lg font-medium text-center sm:text-left u-text-gray-500">
          <ContentSlot :use="$slots.description" unwrap="p" />
        </p>
      </div>
      <BlogPostFeatured />
    </div>
  </UContainer>
</template>
