export default defineAppConfig({
  assistant: {
    faqQuestions: [
      {
        category: 'Getting Started',
        items: [
          'Create a new Nuxt project',
          'What\'s new in Nuxt 4?',
          'Show me a starter template'
        ]
      },
      {
        category: 'Features',
        items: [
          'useFetch vs useAsyncData?',
          'How does file-based routing work?',
          'Add Pinia to my project'
        ]
      },
      {
        category: 'Deploy & Explore',
        items: [
          'Deploy to Vercel',
          'Latest blog posts',
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
