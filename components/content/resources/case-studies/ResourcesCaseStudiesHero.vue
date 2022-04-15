<template>
  <UContainer padded>
    <div class="text-center py-12 md:py-20">
      <h1 class="text-4xl tracking-tight font-extrabold u-text-gray-900 sm:text-5xl">
        <Markdown use="title" unwrap="p" />
      </h1>
      <p class="mt-3 max-w-md mx-auto text-base u-text-gray-500 sm:text-lg md:mt-5 md:max-w-2xl">
        <Markdown use="description" unwrap="p" />
      </p>
    </div>
  </UContainer>
</template>
