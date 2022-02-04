<script setup>
definePageMeta({
  layout: false
})

useMeta({
  htmlAttrs: {
    class: 'bg-black'
  },
  bodyAttrs: {
    class: 'bg-black antialiased font-sans'
  }
})
</script>

<template>
  <UContainer class="h-screen flex flex-col justify-center">
    <Logo class="logo" />
    <h1 class="title">
      A better way to create<br>modern websites.
    </h1>
    <p class="description">
      Our suite of developer-friendly solutions helps you create,<br>secure and deliver enterprise-grade modern website.
    </p>
    <div class="links">
      <a href="https://nuxtlabs.com">Company</a>
      <a href="https://nuxtjs.org">Framework</a>
    </div>
    <!-- Work in progress... 👀 -->
  </UContainer>
</template>

<style scoped>
.container {
  padding: 48px 16px;
}
.logo {
  height: 64px;
  color: #00DC82;
  margin-bottom: 20px;
}
.title {
  color: #fff;
  font-weight: 500;
  font-size: 92px;
  line-height: 1.1;
  margin: 20px 0;
}
.description {
  color: #aaa;
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
  background-color: transparent;
  border-radius: 8px;
}
.links a:hover {
  border-color: #fff;
  color: #000;
  background-color: #fff;
}
</style>
