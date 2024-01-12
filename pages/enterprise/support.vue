<script setup lang="ts">
const route = useRoute()

const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description
useSeoMeta({
  titleTemplate: '%s · Enterprise',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · Enterprise`
})

defineOgImage({
  component: 'Docs',
  title,
  description,
  headline: 'Enterprise'
})
</script>

<template>
  <UContainer>
    <UPage v-if="page">
      <UPageHero :title="page.title" :description="page.description" align="center" />


      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <ULandingSection v-for="(section, index) of page.sections" :key="index" :slot="section.slot" :ui="{ container: 'gap-y-0 sm:gap-y-0' }">
        <template #title>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="section?.title" />
        </template>

        <template v-if="section?.description" #description>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="section.description" />
        </template>

        <template #form>
          <EnterpriseSupportFormSection :form="section.form" :call="section.call" />
        </template>

        <template #testimonials>
          <UPageColumns class="my-[72px]">
            <!-- Hack for Safari -->
            <div v-for="(testimonial) in section.testimonials" :key="testimonial" class="break-inside-avoid">
              <ULandingTestimonial v-bind="testimonial" :ui="{ background: 'card-testimonial-bg' }" />
            </div>
          </UPageColumns>
          <ul class="flex space-x-10 flex-wrap justify-center">
            <li v-for="(logo) in section.logos" :key="logo" class="pt-8">
              <NuxtImg :src="logo.src" :width="logo.width" height="24" alt="" />
            </li>
          </ul>
        </template>

        <template #faq>
          <ULandingFAQ :items="section.faqs" class="pt-[72px]" />
        </template>
      </ULandingSection>
    </UPage>
  </UContainer>
</template>

<style scoped lang="postcss">
.dark .card-testimonial-bg {
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.20) 0%, rgba(15, 23, 42, 0.20) 100%), linear-gradient(180deg, rgba(51, 65, 85, 0.50) 0%, rgba(2, 4, 32, 0.50) 33.92%);
}
</style>
