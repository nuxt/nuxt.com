import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const docsSource = {
  cwd: process.env.NUXT_PATH ?? undefined,
  repository: !process.env.NUXT_PATH ? 'https://github.com/nuxt/nuxt/tree/3.x' : undefined,
  include: 'docs/**/*'
}

const examplesSource = {
  cwd: process.env.NUXT_EXAMPLES_PATH ?? undefined,
  repository: !process.env.NUXT_EXAMPLES_PATH ? 'https://github.com/nuxt/examples' : undefined,
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

const Link = z.object({
  label: z.string(),
  to: z.string(),
  icon: z.string().optional()
})

const Button = z.object({
  label: z.string(),
  icon: z.string().optional(),
  trailingIcon: z.string().optional(),
  to: z.string().optional(),
  color: z.enum(['primary', 'neutral', 'success', 'warning', 'error', 'info']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link']).optional(),
  id: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional()
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

const Template = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  repo: z.string().optional(),
  demo: z.string().url(),
  purchase: z.string().url().optional(),
  featured: z.boolean().optional(),
  badge: z.enum(['Premium', 'Freemium', 'Free']).optional(),
  screenshotUrl: z.string().url().optional(),
  screenshotOptions: z.object({
    delay: z.number()
  }).optional()
})

const ShowcaseItem = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  hostname: z.string().optional(),
  screenshotUrl: z.string().optional(),
  screenshotOptions: z.object({
    delay: z.number()
  }).optional()
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
          companies: z.array(DualModeImage)
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
        contributors: PageSection,
        stats: PageSection.extend({
          community: BaseSection,
          x: z.number(),
          discord: z.string(),
          cta: Button
        }),
        support: PageSection.extend({
          companies: z.array(Image.pick({ src: true, alt: true }))
        }),
        sponsors: PageSection.extend({
          cta: Button
        })
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: [docsSource, examplesSource],
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
        draft: z.boolean().optional(),
        category: z.enum(['Release', 'Tutorial', 'Announcement', 'Article']),
        tags: z.array(z.string())
      })
    }),
    landing: defineCollection({
      type: 'page',
      source: [
        { include: 'index.md' },
        { include: 'blog.yml' },
        { include: 'modules.yml' },
        { include: 'deploy.yml' },
        { include: 'templates.yml' },
        { include: 'video-courses.yml' },
        { include: 'enterprise/sponsors.yml' },
        { include: 'enterprise/agencies.yml' },
        { include: 'newsletter.yml' },
        { include: 'enterprise/jobs.yml' }
      ],
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
      source: 'enterprise/support.yml',
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
              logo: DualModeImage,
              achievements: z.array(
                z.object({
                  label: z.string(),
                  color: z.enum(['success', 'warning', 'error', 'info', 'neutral', 'important'])
                })
              ),
              width: z.number(),
              height: z.number()
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
    }),
    agencies: defineCollection({
      type: 'page',
      source: 'enterprise/agencies/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        logo: DualModeImage,
        logoFull: z.string().optional(),
        link: z.string().url(),
        services: z.array(z.string()),
        resources: z.array(Link).optional(),
        emailAddress: z.string().email().optional(),
        phoneNumber: z.string().nullable().optional(),
        x: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        instagram: z.string().optional(),
        color: z.array(z.string()).optional(),
        regions: z.array(z.string()),
        location: z.string()
      })
    }),
    templates: defineCollection({
      type: 'data',
      source: 'templates/*',
      schema: Template
    }),
    showcase: defineCollection({
      type: 'data',
      source: 'showcase.yml',
      schema: BaseSection.extend({
        head: z.object({
          title: z.string().optional(),
          description: z.string().optional()
        }).optional(),
        groups: z.array(z.object({
          name: z.string(),
          icon: z.string(),
          showcases: z.array(ShowcaseItem)
        }))
      })
    }),
    videoCourses: defineCollection({
      type: 'data',
      source: 'video-courses/*',
      schema: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        url: z.string().url(),
        badge: z.enum(['Premium', 'Free']).optional(),
        screenshotOptions: z.object({
          delay: z.number(),
          removeElements: z.array(z.string()).optional()
        }).optional(),
        sponsor: z.boolean().optional()
      })
    }),
    designKit: defineCollection({
      type: 'page',
      source: 'design-kit.md',
      schema: PageHero
    }),
    team: defineCollection({
      type: 'page',
      source: 'team.yml',
      schema: PageHero.extend({
        users: z.array(z.object({
          name: z.string(),
          location: z.string(),
          sponsor: z.string().url(),
          avatar: Image,
          links: z.array(Link)
        }))
      })
    })
  }
})
