import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import highlight from 'comark/plugins/highlight'
import toc from 'comark/plugins/toc'

export const content = comarkContent({
  sources: {
    'index': fs('./content/index.yml'),
    'showcase': fs('./content/showcase.yml'),
    'video-courses': fs('./content/video-courses.yml'),
    'video-courses-list': fs('./content/video-courses'),
    'agencies': fs('./content/enterprise/agencies.yml'),
    'agencies-list': fs('./content/enterprise/agencies', { prefix: '/enterprise/agencies' }),
    'blog': fs('./content/blog.yml'),
    'blog-list': fs('./content/blog', { prefix: '/blog' })
  },
  plugins: [
    yaml(),
    json()
  ],
  markdown: {
    plugins: [
      highlight(),
      toc()
    ]
  }
})
