import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const docsSource = {
  cwd: process.env.NUXT_PATH ?? undefined,
  repository: !process.env.NUXT_PATH ? 'https://github.com/nuxt/nuxt/tree/feat/migrate-to-content-v3' : undefined,
  include: 'docs/**/*'
}
const examplesSource = {
  cwd: process.env.NUXT_EXAMPLES_PATH ?? undefined,
  repository: !process.env.NUXT_EXAMPLES_PATH ? 'https://github.com/nuxt/examples/tree/feat/migrate-to-content-v3' : undefined,
  include: '.docs/**/*',
  prefix: '/docs/4.examples'
}

const Image = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional()
})

const DualModeImage = z.object({
  light: z.string().editor({ input: 'media' }),
  dark: z.string().editor({ input: 'media' }),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional()
})

const Button = z.object({
  label: z.string(),
  icon: z.string(),
  trailingIcon: z.string().optional(),
  to: z.string(),
  color: z.enum(['primary', 'neutral']).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'link']).optional(),
  id: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional()
})

const Link = z.object({
  label: z.string(),
  to: z.string(),
  icon: z.string().optional()
})

const BaseSection = z.object({
  title: z.string(),
  description: z.string()
})

const Author = z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  twitter: z.string().optional(),
  to: z.string().optional(),
  avatar: Image.optional()
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

const PageSection = BaseSection.extend({
  links: z.array(Button),
  features: z.array(PageFeature),
  image: DualModeImage,
  cta: z.object({
    title: z.string(),
    label: z.string(),
    to: z.string(),
    icon: z.string()
  }).optional()
})

const PageHero = BaseSection.extend({
  image: DualModeImage.optional(),
  head: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).optional(),
  headline: z.object({
    label: z.string(),
    to: z.string(),
    icon: z.string().optional().editor({ input: 'icon' })
  }).optional(),
  links: z.array(Button).optional(),
  cta: Link.optional()
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
          cta: Link.extend({
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
            link: Link
          }))
        }),
        modules: PageSection,
        testimonial: Testimonial,
        deploy: PageSection,
        stats: PageSection.extend({
          community: BaseSection,
          x: z.number(),
          discord: z.string(),
          cta: Button
        }),
        expertise: PageSection.extend({
          companies: z.array(Image.pick({ src: true, alt: true }))
        }),
        sponsors: PageSection.extend({
          cta: Button
        })
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: [
        docsSource,
        examplesSource
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
      }, {
        include: 'deploy.yml'
      }, {
        include: 'showcase.yml'
      }],
      schema: PageHero
    }),
    deploy: defineCollection({
      type: 'page',
      source: 'deploy/*',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        componentImg: z.string(),
        logoSrc: z.string(),
        featured: z.boolean(),
        logoIcon: z.string(),
        category: z.string(),
        nitroPreset: z.string(),
        website: z.string().url()
      })
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
          DualModeImage.extend({
            alt: z.string()
          }).omit({ width: true, height: true }).extend({
            width: z.string(),
            height: z.string()
          })
        ),
        service: BaseSection.extend({
          services: z.array(
            BaseSection.extend({
              icon: z.string()
            })
          )
        }),
        expertise: BaseSection.extend({
          logos: z.array(
            Image.extend({
              color: z.string()
            })
          )
        }),
        testimonials: BaseSection.extend({
          items: z.array(
            z.object({
              quote: z.string(),
              author: z.string(),
              job: z.string(),
              logo: DualModeImage.extend({
                alt: z.string()
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
        project: BaseSection.extend({
          steps: z.array(
            BaseSection.extend({
              number: z.number()
            })
          )
        }),
        form: BaseSection.extend({
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
          button: Button
        })
      })
    })
  }
})
