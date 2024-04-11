---
title: AWS Amplify
description: 'Deploy your Nuxt Application to AWS Amplify infrastructure.'
componentImg: Amplify
logoIcon: 'i-logos-aws-amplify'
category: Hosting
featured: true
nitroPreset: 'aws-amplify'
website: 'https://aws.amazon.com/amplify/?trk=bed847b4-6e9f-4e09-ba09-0d4680a0447b&sc_channel=el'
---

::tip
**Zero Configuration ✨**
:br
Integration with AWS Amplify is possible with zero configuration, [learn more](https://nitro.unjs.io/deploy#zero-config-providers).
::

## Setup

1. Login to the [AWS Amplify Hosting Console](https://console.aws.amazon.com/amplify/?trk=01c5a476-5997-4e6a-88b9-fd0a0a5bbe34&sc_channel=el)
2. Click on "Get Started" > Amplify Hosting (Host your web app)
3. Select and authorize access to your Git repository provider and select the main branch
4. Choose a name for your app, make sure build settings are auto-detected and optionally set requirement environment variables under the advanced section
5. Optionally, select Enable SSR logging to enable server-side logging to your Amazon CloudWatch account
6. Confirm configuration and click on "Save and Deploy"

## Learn more

::read-more{to="https://www.youtube.com/watch?v=CAk5_XGkOG4" target="_blank"}
View an Amplify Hosting tutorial with Nuxt
::

::read-more{to="https://nitro.unjs.io/deploy/providers/aws-amplify" target="_blank"}
Head over **Nitro documentation** to learn more about the aws-amplify deployment preset.
::
