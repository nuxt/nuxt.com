<template>
  <UContainer padded class="py-12">
    <img src="/company/support/gradient.svg" class="absolute right-0 hidden lg:block">

    <div class="relative flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:gap-20">
      <Markdown :use="$slots.default" />
    </div>
  </UContainer>
</template>
