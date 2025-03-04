import { defineContentConfig, defineCollection, z } from '@nuxt/content'

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
  }),
  cta: z.object({
    title: z.string(),
    label: z.string(),
    to: z.string(),
    icon: z.string()
  }).optional()
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

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'data',
      source: 'index.yml',
      schema: z.object({
        hero: z.object({
          title: z.string(),
          description: z.string(),
          cta: z.object({
            label: z.string(),
            to: z.string(),
            icon: z.string()
          }),
          tabs: z.array(z.object({
            title: z.string(),
            icon: z.string(),
            content: z.string()
          }))
        }),
        logos: z.object({
          title: z.string(),
          companies: z.array(z.object({
            url: z.string(),
            alt: z.string()
          }))
        }),
        features: PageSection,
        foundation: PageSection.extend({
          items: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            logo: z.string(),
            color: z.string(),
            gradient: z.string(),
            link: z.object({
              label: z.string(),
              to: z.string()
            })
          }))
        }),
        modules: PageSection,
        testimonial: Testimonial,
        deploy: PageSection,
        stats: PageSection.extend({
          community: z.object({
            title: z.string(),
            description: z.string()
          }),
          x: z.number(),
          discord: z.string(),
          cta: Button
        }),
        expertise: PageSection.extend({
          companies: z.array(z.object({
            src: z.string(),
            alt: z.string()
          }))
        }),
        sponsors: PageSection.extend({
          cta: Button
        })
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
    landing: defineCollection({
      type: 'page',
      source: [{
        include: 'index.md'
      }, {
        include: 'blog.yml'
      }, {
        include: 'modules.yml'
      }]
    }),
    support: defineCollection({
      type: 'data',
      source: '8.enterprise/support.yml',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        hero: z.object({
          links: z.array(Button)
        }),
        logos: z.array(
          z.object({
            light: z.string(),
            dark: z.string(),
            width: z.string(),
            height: z.string(),
            alt: z.string()
          })
        ),
        service: z.object({
          title: z.string(),
          description: z.string(),
          services: z.array(
            z.object({
              icon: z.string(),
              title: z.string(),
              description: z.string()
            })
          )
        }),
        expertise: z.object({
          title: z.string(),
          description: z.string(),
          logos: z.array(
            z.object({
              src: z.string(),
              width: z.number(),
              height: z.number(),
              color: z.string(),
              alt: z.string()
            })
          )
        }),
        testimonials: z.object({
          title: z.string(),
          description: z.string(),
          items: z.array(
            z.object({
              quote: z.string(),
              author: z.string(),
              job: z.string(),
              logo: z.object({
                light: z.string(),
                dark: z.string(),
                alt: z.string(),
                width: z.number(),
                height: z.number()
              }),
              achievements: z.array(
                z.object({
                  label: z.string(),
                  color: z.string()
                })
              ),
              width: z.number().optional(),
              height: z.number().optional()
            })
          )
        }),
        project: z.object({
          title: z.string(),
          description: z.string(),
          steps: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              number: z.number()
            })
          )
        }),
        form: z.object({
          title: z.string(),
          description: z.string(),
          name: z.object({
            label: z.string(),
            placeholder: z.string()
          }),
          email: z.object({
            label: z.string(),
            placeholder: z.string()
          }),
          company: z.object({
            label: z.string(),
            placeholder: z.string()
          }),
          link: z.object({
            label: z.string(),
            placeholder: z.string()
          }),
          body: z.object({
            label: z.string(),
            placeholder: z.string()
          }),
          info: z.string(),
          button: z.object({
            icon: z.string(),
            label: z.string()
          })
        })
      })
    })
  }
})
