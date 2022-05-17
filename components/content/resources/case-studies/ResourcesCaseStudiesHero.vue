<template>
  <UContainer padded>
    <div class="py-12 text-center md:py-20">
      <h1 class="text-4xl font-semibold tracking-tight u-text-gray-900 sm:text-5xl">
        <Markdown use="title" unwrap="p" />
      </h1>
      <p class="max-w-md mx-auto mt-3 font-medium u-text-gray-500 sm:text-lg md:mt-5 md:max-w-2xl">
        <Markdown use="description" unwrap="p" />
      </p>
    </div>
  </UContainer>
</template>
