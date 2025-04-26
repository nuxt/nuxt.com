<script setup lang="ts">
const carbonads = useTemplateRef('carbonads')

onMounted(() => {
  if (carbonads.value) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', 'https://cdn.carbonads.com/carbon.js?serve=CWYD553E&placement=nuxtcom')
    script.setAttribute('id', '_carbonads_js')
    carbonads.value.appendChild(script)
  }
})
</script>

<template>
  <div ref="carbonads" class="carbon" />
</template>

<style scoped>
@reference "../../assets/css/main.css";

.carbon :deep(#carbonads) {
  @apply relative border border-default rounded-[calc(var(--ui-radius)*1.5)] hover:bg-elevated/50 w-full transition-colors min-h-[220px] p-2;

  .carbon-img {
    @apply flex justify-center w-full;

    & > img {
      @apply !max-w-full w-full rounded-(--ui-radius);
    }
  }

  .carbon-text {
    @apply text-sm text-muted transition-colors text-center text-pretty flex pt-2;
  }

  .carbon-poweredby {
    @apply block text-xs text-center text-muted pt-2;
  }

  &:hover {
    .carbon-text {
      @apply text-default;
    }
  }
}
</style>
