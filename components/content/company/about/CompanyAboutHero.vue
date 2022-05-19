<template>
  <div class="relative flex flex-col md:flex-row justify-center items-center md:h-[475px]">
    <div class="relative flex items-center justify-end w-full overflow-hidden md:w-auto md:absolute md:right-0">
      <img src="/assets/company/about/gems.svg">
      <div class="h-[200px] w-full absolute -top-16 right-0 bg-gradient-to-b from-white dark:from-black to-transparent picture-overlay-top" />
      <div class="h-[200px] w-full absolute -bottom-16 left-0 bg-gradient-to-t from-white dark:from-black to-transparent picture-overlay-bottom" />
    </div>

    <UContainer padded class="relative w-full py-12">
      <div class="flex flex-col justify-center py-8 space-y-5">
        <h1 class="text-5xl font-semibold lg:max-w-xl u-text-gray-900">
          <Markdown use="title" unwrap="p" />
        </h1>
        <p class="text-lg font-medium lg:max-w-xl u-text-gray-500">
          <Markdown use="description" unwrap="p" />
        </p>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.picture-overlay-top {
  transform: translateX(10%) rotate(10deg);
}
.picture-overlay-bottom {
  transform: translateX(-15%) rotate(20deg);
}
</style>
