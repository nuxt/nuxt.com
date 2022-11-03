<template>
  <PageHero>
    <template #title>
      <ContentSlot :use="$slots.title" unwrap="p" />
    </template>
    <template #description>
      <ContentSlot :use="$slots.description" unwrap="p" />
    </template>

    <template #extra>
      <div class="flex gap-3">
        <span class="u-text-gray-500">Download extension:</span>
        <div class="flex gap-6">
          <GradientNuxtLink to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank" class="font-semibold u-text-gray-900">
            Chrome
          </GradientNuxtLink>
          <GradientNuxtLink to="https://addons.mozilla.org/en/firefox/addon/vue-telescope/" target="_blank" class="font-semibold u-text-gray-900">
            Firefox
          </GradientNuxtLink>
        </div>
      </div>
    </template>

    <template #image>
      <img src="/assets/resources/showcases/gems.svg" class="object-contain h-full lg:mx-10 opacity-10 lg:opacity-100" role="presentation">
    </template>
  </PageHero>
</template>

<style scoped lang="ts">
css({
  '.description': {
    textColor: '{color.green.400}'
  }
})
</style>
