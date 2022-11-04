<template>
  <PageHero>
    <template #title>
      Showcase
    </template>
    <template #description>
      Discover our selection of websites built with Nuxt. This collection is powered by <NuxtLink to="https://vuetelescope.com" class="description">
        VueTelescope
      </NuxtLink>.
    </template>

    <template #extra>
      <div class="hero-extra">
        <span class="u-text-gray-500">Download extension:</span>
        <div>
          <GradientNuxtLink to="https://chrome.google.com/webstore/detail/vue-telescope/neaebjphlfplgdhedjdhcnpjkndddbpd" target="_blank" class="u-text-gray-900">
            Chrome
          </GradientNuxtLink>
          <GradientNuxtLink to="https://addons.mozilla.org/en/firefox/addon/vue-telescope/" target="_blank" class="u-text-gray-900">
            Firefox
          </GradientNuxtLink>
        </div>
      </div>
    </template>

    <template #image>
      <img src="/assets/resources/showcases/gems.svg" class="hero-image" role="presentation">
    </template>
  </PageHero>
</template>

<style scoped lang="ts">
css({
  '.hero-extra': {
    display: 'flex',
    gap: '0.75rem',
    'div': {
      display: 'flex',
      gap: '1.5rem',
      '& > *': {fontWeight: '600'},
    }
  },
  '.hero-image': {
    height: '100%',
    objectFit: 'contain',
    opacity: '0.1',
    '@mq.lg': {
      marginLeft: '2.5rem',
      marginRight: '2.5rem',
      opacity: '1',
    }
  }
})
</style>
