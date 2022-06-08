<template>
  <div class="relative overflow-hidden">
    <img src="/assets/community/about/gradient.svg" class="absolute right-0 w-[600px] h-[578px] top-[148px]">
    <UContainer padded class="relative grid grid-cols-1 md:grid-cols-2 gap-x-[30px] pt-[148px] pb-[300px]">
      <div class="flex flex-col pt-8 gap-y-8">
        <h2 class="text-4xl font-semibold u-text-gray-900">
          <Markdown :use="$slots.title" unwrap="p" />
        </h2>
        <div class="relative pt-8">
          <img src="/assets/community/about/quotes.svg" alt="Quotes image" class="absolute top-4 -left-[22px] w-[60px] h-10">
          <p class="text-2xl font-medium u-text-gray-900">
            <Markdown :use="$slots.description" unwrap="p" />
          </p>
        </div>
        <blockquote class="text-xl u-text-gray-500">
          <Markdown :use="$slots.author" unwrap="p" />
        </blockquote>
      </div>
      <div class="grid grid-cols-2 w-full h-[337px] gap-4 relative pt-8 md:pt-0">
        <div class="flex justify-center col-span-2">
          <img src="/assets/community/about/chopin-brothers.png" class=" border-gray-100/50 dark:border-gray-800/20 border-[8px] rounded-xl">
        </div>
        <div class="flex justify-end">
          <img src="/assets/community/about/chopin-alexandre.png" class="border-gray-50/25 dark:border-gray-800/20 border-[8px] rounded-xl">
        </div>
        <div class="flex justify-start">
          <img src="/assets/community/about/chopin-sebastien.png" class="border-gray-50/25 dark:border-gray-800/20 border-[8px] rounded-xl">
        </div>
      </div>
    </UContainer>
  </div>
</template>
