<template>
  <UContainer padded class="py-12">
    <div class="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:gap-20">
      <Markdown :use="$slots.default" />
    </div>
  </UContainer>
</template>
