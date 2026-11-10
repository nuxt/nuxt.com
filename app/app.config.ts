export default defineAppConfig({
  agent: {
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
          'What are the available rendering modes?',
          'How do I add SEO meta tags in Nuxt?'
        ]
      }
    ]
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral',
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
        slots: {
          base: 'w-full'
        }
      },
      codeTree: {
        slots: {
          root: 'bg-default m-0',
          content: '[&>div>pre]:rounded-r-none'
        }
      },
      callout: {
        slots: {
          // A single paragraph is unwrapped so the inline icon sits next to its text; with several children the first `<p>` stays a block and pushes the icon onto its own line. An inline `<p>` loses its `my-5`, so the next block gets it back.
          base: '[&>.iconify+p]:inline [&>.iconify+p+*]:mt-5'
        }
      },
      codeIcon: {
        wat: 'i-lucide-file-braces'
      }
    }
  }
})
