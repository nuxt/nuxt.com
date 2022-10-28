<template>
  <div class="flex flex-col">
    <div class="relative">
      <ul class="z-[-1] grid grid-cols-1 overflow-hidden list-none gap-y-8 gap-x-8 sm:gap-x-12 md:gap-x-20 lg:gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
        <ContentSlot :use="$slots.items" unwrap="p" />
      </ul>
    </div>
  </div>
</template>
