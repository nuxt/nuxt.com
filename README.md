![nuxt-website](https://github.com/nuxt/nuxt.com/assets/904724/7453c94f-1733-45b6-ae11-ca889a9b9f1b)

# nuxt.com

Welcome to the Nuxt website repository available on [nuxt.com](https://nuxt.com).

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

Copy the output of the command above and paste it in the `NUXT_DOCS_PATH` variable in the `.env` file.

## Development

Start the development server:

```bash
npm run dev
```

## Production

In order to build the application for production, you need to have a [Nuxt UI Pro license](https://ui.nuxt.com/pro/purchase) and set the `NUXT_UI_PRO_LICENSE` variable in the `.env` file.

Note that this is not required to run in development and contribute to the Nuxt website or documentation.

Build the application for production:

```bash
npm run generate
```

## License

[MIT License](./LICENSE)
