<template>
  <div class="flex flex-col min-h-screen">
    <NuxtNationBanner />
    <Navbar />
    <main class="min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col">
      <slot />
    </main>
    <Footer />
  </div>
</template>
