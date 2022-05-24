<template>
  <UContainer padded class="pt-8 pb-16">
    <img src="/assets/company/support/gradient.svg" class="absolute right-0 hidden lg:block">

    <div class="relative flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:gap-20">
      <Markdown :use="$slots.default" />
    </div>
  </UContainer>
</template>
