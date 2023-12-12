<a href="https://nuxt.com"><img width="1200" alt="Nuxt Website" src="https://github.com/nuxt/nuxt.com/assets/904724/22772d8b-4fff-4cf9-a592-85c5ff5d6d58"></a>

# nuxt.com

Welcome to the Nuxt website repository available on [nuxt.com](https://nuxt.com).

[![Nuxt UI Pro](https://img.shields.io/badge/Made%20with-Nuxt%20UI%20Pro-00DC82?logo=nuxt.js&labelColor=020420)](https://ui.nuxt.com/pro)

## Setup

Make sure to install the dependencies

```bash
pnpm install
```

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Clone/Fork [nuxt/nuxt](https://github.com/nuxt/nuxt) repo where you want (but not in the Nuxt.com project) and inside the `docs/` directory, run:

```bash
pwd
```

If you are on Windows, you can use the following command instead:

```bash
echo %cd%
```

Copy the output of the command above and paste it in the `NUXT_DOCS_PATH` variable in the `.env` file.

## Development

Start the development server:

```bash
npm run dev
```

### Add a Nuxt Template

To list a Nuxt template, add it to the list on [./content/3.templates.yml](./content/3.templates.yml).

Make sure to start the development server in order to generate the screenshot for the template and go to http://localhost:3000/templates to see the result.

If you want to update the screenshot url (ex: another page), use the `screenshotUrl` property.

To regenerate the image, delete the generated one in `public/asses/templates`.

## Production

In order to build the application for production, you need to have a [Nuxt UI Pro](https://ui.nuxt.com/pro) license and set the `NUXT_UI_PRO_LICENSE` variable in the `.env` file.

Note that this is not required to run in development and contribute to the Nuxt website or documentation.

Build the application for production:

```bash
npm run generate
```

## License

[MIT License](./LICENSE)
