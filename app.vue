<script setup>
useMeta({
  title: 'Nuxt: Intuitive Web Development',
   meta: [
     { name: 'description', content: 'Nuxt makes web development intuitive and fun. The open source framework NuxtJS makes the development of modern web applications simple.' },
    { property: 'og:site_name', content: 'Nuxt' },
    { property: 'og:type', content: 'website' },
    { name: 'og:image', content: 'https://nuxt.com/social.png' },
    { property: 'og:image:alt', content: 'Nuxt' },
    { property: 'twitter:image', content: 'https://nuxt.com/social-twitter.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@nuxt_js' }
  ],
})
</script>

<template>
  <div class="container">
    <Logo/>
    <div class="links">
      <a href="https://nuxtjs.org">Framework</a>
      <a href="https://nuxtlabs.com">Company</a>
    </div>
    <!-- Work in progress... 👀 -->
  </div>
</template>

<style>
body {
  margin: 0;
  min-height: 100vh;
  background: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.links {
  display: flex;
  margin-top: 5px;
  gap: 10px;
}
.links a {
  font-size: 15px;
  color: #888;
  text-decoration: none;
  transition: all 0.2s;
  padding-bottom: 2px;
  border-bottom: 1px transparent solid;
}
.links a:hover {
  border-bottom: 1px white solid;
  color: white;
}
</style>