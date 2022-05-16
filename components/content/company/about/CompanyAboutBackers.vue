<template>
  <UContainer padded class="flex flex-col py-24">
    <h2 class="max-w-sm text-4xl font-semibold lg:sticky lg:top-24 u-text-gray-900">
      <Markdown use="title" unwrap="p" />
    </h2>

    <div class="mt-12 lg:mt-0 lg:flex lg:justify-end lg:-translate-y-[80px] lg:-mb-[80px]">
      <div class="grid grid-cols-2 gap-24">
        <slot name="content" />
      </div>
    </div>
  </UContainer>
</template>
