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

::caution
If you are **not** using a custom domain, you need to set `NUXT_APP_BASE_URL` to your repository-slug for your build step.

**Example**: `https://<group/user>.gitlab.io/<repository>/`: `NUXT_APP_BASE_URL=/<repository>/ npx nuxt build --preset github_pages`
::

## Deployment

1. Here is an example GitLab Pages workflow to deploy your site to GitLab Pages:

```yaml [.gitlab-ci.yml]
# Job name has to be `pages`. See https://docs.gitlab.com/ee/user/project/pages/#how-it-works
pages:
   image: node
   before_script:
      - npm ci --cache .npm --prefer-offline
   script:
      # Specify the steps involved to build your app here
      - npm run generate
   cache: # https://docs.gitlab.com/ee/ci/caching/#cache-nodejs-dependencies
      key:
         files:
         - package-lock.json
      paths:
         - .npm/
   artifacts:
      paths:
         # The directory that contains the built files to be published
         - .output/public
   # The directory that contains the built files to be published
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
