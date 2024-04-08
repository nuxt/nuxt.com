---
title: GitLab Pages
description: 'Deploy your Nuxt Application to GitLab Pages.'
logoSrc: '/assets/integrations/gitlab.svg'
category: Hosting
website: 'https://docs.gitlab.com/ee/user/project/pages'
---

Nuxt supports deploying on the [GitLab Pages](https://docs.gitlab.com/ee/user/project/pages) with minimal configuration.

::caution
GitLab Pages only support static sites, Nuxt will pre-render your application to static HTML files.
::

## Deployment

1. Here is an example GitLab Pages workflow to deploy your site to GitLab Pages:

```yaml [.gitlab-ci.yml]
# The Docker image that will be used to build your app
image: node:lts
# Functions that should be executed before the build script is run
before_script:
   - npm install
cache:
   paths:
      # Directories that are cached between builds
      - node_modules/
pages:
   script:
      # Specify the steps involved to build your app here
      - npm run generate
   artifacts:
      paths:
         # The directory that contains the built files to be published. 
         - .output/public
   # The directory that contains the built files to be published.
   publish: .output/public
   rules:
      # This ensures that only pushes to the default branch 
      # will trigger a pages deploy
      - if: $CI_COMMIT_REF_NAME == $CI_DEFAULT_BRANCH
```

## Learn more

::read-more{to="https://docs.gitlab.com/ee/user/project/pages/getting_started_part_one.html#project-website-examples" target="_blank"}
Head over **GitLab Pages default domain names and URLs** to learn more about the GitLab Pages default domain names.
::
