import { defineContentConfig, defineCollection, z } from '@nuxt/content'

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
  avatar: Image.optional(),
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
  bluesky: z.string().optional(),
  to: z.string().optional(),
  avatar: Image.optional()
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
    blog: defineCollection({
      type: 'page',
      source: 'blog/*',
      schema: z.object({
        image: z.string().editor({ input: 'media' }),
        authors: z.array(Author),
        date: z.string().date(),
        draft: z.boolean().default(false),
        category: z.enum(['Release', 'Tutorial', 'Announcement', 'Article']),
        tags: z.array(z.string())
      })
    }),
    landing: defineCollection({
      type: 'page',
      source: [
        { include: 'index.md' },
        { include: 'modules.yml' },
        { include: 'deploy.yml' },
        { include: 'enterprise/sponsors.yml' },
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
        sponsor: z.boolean(),
        logoIcon: z.string(),
        category: z.string(),
        nitroPreset: z.string(),
        website: z.string().url()
      })
    }),
    manualSponsors: defineCollection({
      type: 'data',
      source: 'enterprise/manual-sponsors.yml',
      schema: z.object({
        sponsors: z.array(z.object({
          sponsorName: z.string(),
          sponsorLogo: z.string(),
          sponsorUrl: z.string(),
          tier: z.enum(['diamond', 'platinum', 'gold', 'silver', 'bronze', 'backers'])
        })).optional()
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
    }),
    evals: defineCollection({
      type: 'data',
      source: 'evals.yml',
      schema: z.object({
        title: z.string(),
        head: z.object({
          title: z.string().optional(),
          description: z.string().optional()
        }).optional(),
        description: z.string(),
        githubUrl: z.string().url()
      })
    })
  }
})
