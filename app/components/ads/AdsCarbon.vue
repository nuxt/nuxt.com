<script setup lang="ts">
const carbonads = ref(null)

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
  <div ref="carbonads" class="carbon-wrapper min-h-[220px] border border-(--ui-border) rounded-lg flex flex-col max-w-full md:max-w-xs overflow-hidden" />
</template>

<style>
.carbon-wrapper {
  padding: 0;
}

.carbon-wrapper #carbonads {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.carbon-wrapper .carbon-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
}

@media (min-width: 320px) {
  .carbon-wrapper .carbon-wrap { flex-direction: row; }
  .carbon-wrapper .carbon-text {
    margin-left: 1rem;
    padding: 0.75rem 0.75rem 0 0;
  }
}

@media (min-width: 768px) {
  .carbon-wrapper .carbon-wrap { flex-direction: column; }
  .carbon-wrapper .carbon-text {
    margin-left: 0;
    padding: 0.75rem;
  }
}

.carbon-wrapper .carbon-img {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  line-height: 0;
}

.carbon-wrapper .carbon-img a {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.carbon-wrapper .carbon-img img {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  object-fit: cover !important;
}

.carbon-wrapper .carbon-text {
  flex: 1;
  font-size: 0.875rem;
  width: 100%;
  margin: 0;
  text-align: left;
  display: block;
  color: var(--ui-text-muted);
  text-decoration: none;
  padding: 0.75rem;
}

.carbon-wrapper .carbon-text:hover {
  color: var(--ui-text-highlighted);
}

.carbon-wrapper .carbon-poweredby {
  font-size: 0.75rem;
  text-align: left;
  color: var(--ui-text-muted);
  display: block;
  padding: 0 0 0.75rem 0.75rem;
  text-decoration: none;
}

.carbon-wrapper .carbon-poweredby:hover {
  color: var(--ui-text-highlighted);
}
</style>
