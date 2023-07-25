<template>
  <div class="xl:sticky xl:pt-8 xl:-mt-8 xl:top-16 xl:max-h-[calc(100vh-64px)]">
    <div class="top-0 right-0 border-b border-dashed xl:absolute xl:pt-8 xl:w-40 xl:max-h-screen u-bg-white xl:border-none">
      <template v-if="toc.length">
        <span class="font-semibold">Table of contents</span>
        <ul class="py-4">
          <li v-for="link in toc" :key="link.text">
            <a
              :href="`#${link.id}`"
              class="block py-1 pl-3 text-sm font-medium truncate u-text-gray-500 hover:font-semibold hover:u-text-gray-900"
              :class="{
                'u-text-gray-900': activeHeadings.includes(link.id),
              }"
              @click.prevent="scrollToHeading(link.id)"
            >
              {{ link.text }}
            </a>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { toc } = useContent()
const { activeHeadings, updateHeadings } = useScrollspy()
watch(route, () => {
  if (process.client) {
    setTimeout(() => {
      updateHeadings([
        ...document.querySelectorAll('.prose h1'),
        ...document.querySelectorAll('.prose h2'),
        ...document.querySelectorAll('.prose h3')
      ])
    }, 200)
  }
}, {
  immediate: true
})
function scrollToHeading (id: string) {
  router.push(`#${id}`)
}
</script>
