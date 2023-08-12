<script setup lang="ts">
const navigation = {
  solutions: [
    { name: 'Marketing', href: '#' },
    { name: 'Analytics', href: '#' },
    { name: 'Commerce', href: '#' },
    { name: 'Insights', href: '#' }
  ],
  support: [
    { name: 'Pricing', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
    { name: 'API Status', href: '#' }
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Partners', href: '#' }
  ],
  legal: [
    { name: 'Claim', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' }
  ]
}
</script>

<template>
  <div class="xl:grid xl:grid-cols-3 xl:gap-8">
    <div class="grid grid-cols-2 gap-8 xl:col-span-2">
      <div class="md:grid md:grid-cols-2 md:gap-8">
        <div>
          <h3 class="text-sm font-semibold leading-6 text-white">
            Solutions
          </h3>
          <ul role="list" class="mt-6 space-y-4">
            <li v-for="item in navigation.solutions" :key="item.name">
              <a :href="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{ item.name }}</a>
            </li>
          </ul>
        </div>
        <div class="mt-10 md:mt-0">
          <h3 class="text-sm font-semibold leading-6 text-white">
            Support
          </h3>
          <ul role="list" class="mt-6 space-y-4">
            <li v-for="item in navigation.support" :key="item.name">
              <a :href="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{ item.name }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="md:grid md:grid-cols-2 md:gap-8">
        <div>
          <h3 class="text-sm font-semibold leading-6 text-white">
            Company
          </h3>
          <ul role="list" class="mt-6 space-y-4">
            <li v-for="item in navigation.company" :key="item.name">
              <a :href="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{ item.name }}</a>
            </li>
          </ul>
        </div>
        <div class="mt-10 md:mt-0">
          <h3 class="text-sm font-semibold leading-6 text-white">
            Legal
          </h3>
          <ul role="list" class="mt-6 space-y-4">
            <li v-for="item in navigation.legal" :key="item.name">
              <a :href="item.href" class="text-sm leading-6 text-gray-300 hover:text-white">{{ item.name }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="mt-10 xl:mt-0">
      <NewsletterForm />
    </div>
  </div>
</template>
