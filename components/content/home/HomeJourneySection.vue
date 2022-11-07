<template>
  <div class="relative mb-20">
    <ContentSlot :use="$slots.content" unwrap="p" />
    <div class="absolute left-0 -top-8 blur-[80px] z-[-1]">
      <img src="/assets/home/home-journey-gradient.svg" class="h-[300px]">
    </div>
  </div>
</template>
