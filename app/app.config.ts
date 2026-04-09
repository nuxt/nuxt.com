export default defineAppConfig({
  assistant: {
    faqQuestions: [
      {
        category: 'Getting Started',
        items: [
          'How to create a new project?',
          'Differences between Nuxt 3 and 4?',
          'How does file-based routing work?'
        ]
      },
      {
        category: 'Data Fetching',
        items: [
          'How to fetch data?',
          'useFetch vs useAsyncData?'
        ]
      },
      {
        category: 'Deployment',
        items: [
          'How to deploy a Nuxt app?',
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
