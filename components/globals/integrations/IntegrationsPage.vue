<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col-reverse md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div class="flex flex-col space-y-5 lg:col-span-2 justify-center py-8">
        <h1 class="font-semibold text-5xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="font-medium text-lg u-text-gray-500 lg:pr-20">
          <Markdown use="description" unwrap="p" />
        </p>

        <UInput
          name="search"
          placeholder="Search an integration"
          class="w-full max-w-sm"
          custom-class=" !u-bg-gray-50"
          size="lg"
          icon="heroicons-outline:search"
        />
      </div>
      <div class="flex items-center justify-center lg:col-span-1">
        <img src="/integrations/hero.png" alt="Integrations illustration" class="h-64 sm:h-80 lg:h-full ">
      </div>
    </div>
  </UContainer>
</template>
