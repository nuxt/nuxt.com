<template>
  <nav>
    <p class="u-text-gray-900">
      Categories
    </p>

    <ul v-if="categories.length">
      <li v-for="category in categories" :key="category.id" class="group">
        <Icon
          v-if="category.icon"
          :name="category.icon"
          class="icon"
          :class="{
            'u-text-gray-900': selectedCategory?.name === category.name,
            'text-gray-400 dark:text-gray-500 group-hover:u-text-gray-900': selectedCategory?.name !== category.name
          }"
        />
        <NuxtLink
          :to="category.to"
          class="nuxtlink"
          :class="{
            'u-text-gray-900 font-medium': selectedCategory?.name === category.name,
            'text-gray-500 dark:text-gray-400 group-hover:u-text-gray-900 focus:u-text-gray-900': selectedCategory?.name !== category.name
          }"
        >
          <span>
            {{ category.name }}
            <span
              v-if="selectedCategory?.name === category.name"
            />
          </span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { categories, selectedCategory } = useResourcesShowcases()
</script>

<style scoped lang="ts">
css({
  'nav': {
    'p': {
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem',
      fontWeight: '600',
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
    },
    'ul': {
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '1rem',
      paddingBottom: '1rem',
      rowGap: '0.75rem',
      'li': {
        display: 'inline-flex',
        alignItems: 'center',
        columnGap: '0.5rem',
        '.icon': {
          width: '1.25rem',
          height: '1.25rem',
          marginRight: '0.25rem',
        },
        '.nuxtlink': {
          display: 'flex',
          span: {
            position: 'relative',
            span: {
              position: 'absolute',
              right: '0',
              left: '0',
              bottom: '-0.25rem',
              backgroundImage: 'linear-gradient(to right, var(--tw-gradient-stops))',
              backgroundColor: '#34D399',
              height: '0.125rem',
            }
          }
        }
      }
    }
  }
})
</style>
