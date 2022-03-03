<template>
  <div class="flex flex-col min-h-screen">
    <Navbar />
    <div class="min-h-[calc(100vh-4rem)] flex flex-col">
      <slot />
    </div>
    <Footer />
  </div>
</template>
