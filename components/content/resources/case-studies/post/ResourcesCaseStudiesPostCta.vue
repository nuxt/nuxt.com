<template>
  <div class="py-10">
    <UCard padded class="relative u-bg-black" body-class="p-6 sm:p-12">
      <span class="z-0 _ellipse" />
      <div class="flex flex-wrap items-center justify-between">
        <h2 class="text-white z-[1] tracking-tight">
          <span class="block text-2xl font-semibold sm:text-3xl">Contact us</span>
          <span class="block mt-2 sm:text-lg">Start building, or get in touch with our app experts.</span>
        </h2>
        <div class="mt-8 flex lg:mt-0 lg:flex-shrink-0 gap-3 z-[1] relative dark">
          <UButton variant="secondary" label="Get in touch" size="lg" class="flex justify-center w-40" />
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
