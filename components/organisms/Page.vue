<template>
  <div class="border-t u-border-gray-200 pt-8 pb-16">
    <header v-if="$slots.header">
      <UContainer padded>
        <slot name="header" />
      </UContainer>
    </header>
    <main>
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>
