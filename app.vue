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
    <Logo class="logo"/>
    <h1 class="title">A better way to create<br/>modern websites.</h1>
    <p class="description">Our suite of developer-friendly solutions helps you create,<br/>secure and deliver enterprise-grade modern website.</p>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.container {
}
.logo {
  height: 64px;
  color: #fff;
  margin-bottom: 20px;
}
.title {
  color: #fff;
  font-weight: 500;
  font-size: 96px;
  line-height: 1.1;
  margin: 20px 0;
}
.description {
  color: #888;
  font-weight: 300;
  font-size: 28px;
  line-height: 1.5;
  letter-spacing: 0.75px;
  padding-bottom: 20px;
}
.links {
  display: flex;
  gap: 20px;
}
.links a {
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 1px;
  color: #ccc;
  text-decoration: none;
  transition: all 0.2s;
  padding: 16px 32px;
  border: 2px #aaa solid;
  border-radius: 8px;
}
.links a:hover {
  border-color: #fff;
  color: #fff;
}
</style>