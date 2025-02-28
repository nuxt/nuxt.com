import { defineContentConfig, defineCollection, z, defineCollectionSource } from '@nuxt/content'

const Button = z.object({
  label: z.string(),
  icon: z.string(),
  trailingIcon: z.string(),
  to: z.string(),
  color: z.enum(['primary', 'neutral']).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'link']).optional(),
  id: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional()
})

const Author = z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  twitter: z.string().optional(),
  to: z.string().optional(),
  avatar: z.object({
    src: z.string(),
    alt: z.string()
  }).optional()
})

const Testimonial = z.object({
  quote: z.string(),
  author: Author
})

const PageFeature = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().editor({ input: 'icon' }),
  to: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional(),
  soon: z.boolean().optional()
})

const PageSection = z.object({
  title: z.string(),
  description: z.string(),
  links: z.array(Button),
  features: z.array(PageFeature),
  image: z.object({
    light: z.string().editor({ input: 'media' }),
    dark: z.string().editor({ input: 'media' }),
    width: z.number().optional(),
    height: z.number().optional()
  })
})

const PageHero = z.object({
  title: z.string(),
  description: z.string(),
  image: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    light: z.string().editor({ input: 'media' }),
    dark: z.string().editor({ input: 'media' })
  }).optional(),
  headline: z.object({
    label: z.string(),
    to: z.string(),
    icon: z.string().optional().editor({ input: 'icon' })
  }).optional(),
  links: z.array(Button).optional()
})

const modules = defineCollectionSource({
  getKeys: async () => {
    return fetch('https://api.nuxt.com/modules')
      .then(res => res.json())
      .then(data => data.modules.map((key: { name: string }) => `${key.name}.json`))
  },
  getItem: async (key: string) => {
    const id = key.split('.')[0]
    return fetch(`https://api.nuxt.com/modules/${id}`)
      .then(res => res.json())
  }
})

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'data',
      source: 'index.yml',
      schema: z.object({
        hero: z.object({
          cta: z.object({
            label: z.string(),
            to: z.string(),
            icon: z.string()
          })
        }),
        logos: z.object({
          title: z.string()
        }),
        sections: z.array(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            class: z.string(),
            align: z.enum(['left', 'right', 'center']).optional(),
            links: z.array(
              z.object({
                label: z.string().optional(),
                icon: z.string(),
                to: z.string(),
                color: z.string().optional(),
                size: z.string().optional(),
                variant: z.string().optional(),
                target: z.string().optional()
              })
            ).optional(),
            slot: z.string().optional(),
            code: z.string().optional(),
            features: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                icon: z.string(),
                to: z.string()
              })
            ).optional(),
            integrations: z.array(
              z.object({
                src: z.string(),
                alt: z.string(),
                to: z.string()
              })
            ).optional(),
            testimonials: z.array(
              z.object({
                quote: z.string(),
                author: z.object({
                  name: z.string(),
                  description: z.string(),
                  to: z.string(),
                  target: z.string().optional(),
                  avatar: z.object({
                    src: z.string(),
                    srcset: z.string().optional()
                  }).optional()
                })
              })
            ).optional()
          })
        )
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: [
        {
          repository: 'https://github.com/nuxt/nuxt/tree/feat/migrate-to-content-v3',
          include: 'docs/**/*'
        },
        {
          repository: 'https://github.com/nuxt/examples/tree/feat/migrate-to-content-v3',
          include: '.docs/**/*',
          prefix: '/docs/4.examples'
        }
      ],
      schema: z.object({
        titleTemplate: z.string().optional(),
        links: z.array(Button)
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/*',
      schema: z.object({
        image: z.string().editor({ input: 'media' }),
        authors: z.array(Author),
        date: z.string().date(),
        category: z.enum(['Release', 'Tutorial']),
        tags: z.array(z.string())
      })
    }),
    /* modules: defineCollection({
      type: 'data',
      source: modules,
      schema: z.object({
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        category: z.enum(['Community', 'Framework', 'Module']),
        npm: z.string().optional(),
        stats: z.object({
          downloads: z.number(),
          stars: z.number().optional(),
          version: z.string().optional()
        }),
        type: z.enum(['official', 'official-with-contributions', 'community']),
        repo: z.string(),
        github: z.string(),
        website: z.string().optional(),
        learn_more: z.string().optional(),
        contributors: z.array(z.object({
          username: z.string(),
          avatar: z.string().optional()
        })),
        readme: z.object({
          body: z.string().optional()
        }),
        compatibility: z.object({
          nuxt: z.string().optional()
        })
      })
    }), */
    landing: defineCollection({
      type: 'page',
      source: [{
        include: 'index.md'
      }, {
        include: 'blog.yml'
      }, {
        include: 'modules.yml'
      }]
    })
  }
})
