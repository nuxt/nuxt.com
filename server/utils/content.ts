import { comarkContent } from 'comark-content'
import fs from 'comark-content/sources/fs'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import highlight from 'comark/plugins/highlight'

export const content = comarkContent({
  sources: {
    'index': fs('./content/index.yml'),
    'showcase': fs('./content/showcase.yml'),
    'video-courses-landing': fs('./content/video-courses.yml'),
    'video-courses': fs('./content/video-courses')
  },
  plugins: [
    yaml(),
    json(),
    highlight()
  ]
})
