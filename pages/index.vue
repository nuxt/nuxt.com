<script setup>
definePageMeta({
  layout: false
})

useMeta({
  bodyAttrs: {
    class: ['bg-black']
  }
})
</script>

<template>
  <div class="container mx-auto">
    <LogoFull class="text-white" />
    <div class="links">
      <a href="https://nuxtjs.org">Framework</a>
      <a href="https://nuxtlabs.com">Company</a>
    </div>
    <!-- Work in progress... 👀 -->
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
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
