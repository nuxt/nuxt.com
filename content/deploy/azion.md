---
title: Azion
description: "Deploy your Nuxt Application to Azion Web Platform."
logoSrc: "/assets/integrations/azion.svg"
category: Hosting
website: "https://www.azion.com/en"
---

Nuxt supports deploying on [Azion](https://azion.com/) with minimal configuration.

Azion is a web platform that allows you to deploy your Nuxt applications globally. It provides a fast and secure way to serve your applications with low latency.

## Deploy to Azion

To deploy your Nuxt application to Azion, you need to install the Azion CLI. You can install it by following this [guide](https://www.azion.com/en/documentation/products/azion-cli/overview/#installing-azion-clil).

Once you have the Azion CLI installed, you can deploy your application by following these steps:

1. Link your application. This will create a new project in Azion and link it to your local application.

```shell
azion link
```

Confirm the linking of the project to Azion:

```shell
? Do you want to link /[your-application-folder] to Azion? (y/N)
```

Enter the desired name for your **application**:

```shell
? (Hit enter to accept the suggested name in parenthesis) Your application's name:  (nimble-tyrion)
```

Choose a **preset**, `Nuxt` is the option you are looking for:

```shell
? Choose a preset:  [Use arrows to move, type to filter]
  ...
> Nuxt
  ...
```

Now, the application will be linked to Azion. Different processes occur based on the selected preset, so you need to answer the interactions that are presented.

2. Deploy your application. This will build your application and deploy it to Azion.

```shell
azion deploy
```

3. Wait while the project is built and deployed to the Azion Web Platform.

::tip
Once the deployment is triggered, Azion will open the browser and take you to a page on the Azion Console where the deployment logs and process can be monitored. If it doesn't open automatically, just click on the provided link.
After the deployment is complete, you'll receive a domain to access your Nuxt project on the Azion Platform.
::

Wait a few minutes for propagation to take place, and then access your application using the provided domain, which should be similar to `https://xxxxxxx.map.azionedge.net`.

## Learn more

::read-more{to="https://www.azion.com/en/documentation/products/guides/nuxt-static-boilerplate/" target="\_blank"}
**Guide**: How to deploy the Nuxt 3 Static Boilerplate
::

::read-more{to="https://www.azion.com/en/documentation/" target="\_blank"}
Head over **Azion Web Platform documentation** to learn more.
::
