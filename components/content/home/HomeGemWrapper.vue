<template>
  <ClientOnly>
    <Markdown :use="$slots.default" unwrap="p" />
  </ClientOnly>
</template>
