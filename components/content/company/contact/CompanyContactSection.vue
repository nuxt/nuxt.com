<template>
  <UContainer padded class="pt-8 pb-16 sm:pb-32">
    <img src="/assets/company/contact/gradient.svg" class="absolute right-0 hidden lg:block">

    <div class="relative z-[1] flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:gap-20">
      <ContentSlot :use="$slots.default" />
    </div>
  </UContainer>
</template>
