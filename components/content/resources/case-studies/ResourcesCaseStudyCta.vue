<template>
  <div class="py-10">
    <UCard class="relative u-bg-black" body-class="p-12">
      <span class="z-0 _ellipse" />
      <div class="flex items-center justify-between">
        <h2 class="u-text-white z-[1] tracking-tight">
          <span class="block text-3xl font-semibold">Contact us</span>
          <span class="block mt-2 text-lg">Start building, or get in touch with our app experts.</span>
        </h2>
        <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3 z-[1] relative">
          <UButton variant="transparent" size="lg" class="flex justify-center w-40 group u-border-white hover:u-border-gray-300 ">
            <span class="u-text-white group-hover:u-text-gray-300">Get in touch</span>
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
._ellipse {
  position: absolute;
  width: 480.14px;
  height: 161.22px;
  left: -100px;
  top: 100px;
  filter: blur(100px);
  background: linear-gradient(97.62deg, rgba(0, 71, 225, 1) 2.27%, rgba(26, 214, 255, 1) 60.88%, #00DC82 80%);
  transform: matrix(-0.97, 0.24, 0.24, 0.97, 0, 0);
}
</style>
