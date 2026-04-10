export default defineAppConfig({
  assistant: {
    faqQuestions: [
      {
        category: 'Getting Started',
        items: [
          'Show me available starter templates',
          'What\'s new in Nuxt 4?',
          'How do I add authentication to my Nuxt app?'
        ]
      },
      {
        category: 'Features',
        items: [
          'useFetch vs useAsyncData?',
          'How does file-based routing work?',
          'How do I connect a database to my Nuxt app?'
        ]
      },
      {
        category: 'Deploy & Explore',
        items: [
          'How do I deploy my Nuxt app?',
          'How do I integrate Stripe payments in Nuxt?',
          'Available rendering modes?'
        ]
      }
    ]
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
      important: 'violet'
    },
    pageHero: {
      slots: {
        container: 'py-10 sm:py-20 lg:py-20',
        title: 'sm:text-5xl'
      }
    },
    prose: {
      img: {
        base: 'w-full'
      },
      codeTree: {
        slots: {
          root: 'bg-default m-0',
          content: '[&>div>pre]:rounded-r-none'
        }
      }
    }
  }
})
