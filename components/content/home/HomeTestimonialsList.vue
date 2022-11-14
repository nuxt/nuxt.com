<template>
  <div class="flex flex-col relative">
    <div class="relative">
      <ul class="z-[-1] grid grid-cols-1 overflow-hidden list-none gap-y-8 gap-x-8 sm:gap-x-12 md:gap-x-20 lg:gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
        <ContentSlot :use="$slots.items" unwrap="p" />
      </ul>
    </div>
    <div class="absolute -right-80 2xl:-right-[600px] bottom-0 blur-[150px] -z-[1]">
      <img src="/assets/home/home-journey-gradient.svg" class="h-[300px]" width="541" height="300" role="presentation">
    </div>
  </div>
</template>
