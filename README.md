# nuxt.com

## Setup

Make sure to install the dependencies

```bash
yarn install
```

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Clone/Fork the [framework](https://github.com/nuxt/nuxt) repo and inside the `docs/` directory, run:

```bash
pwd
```

Copy the output of the command above and paste it in the `NUXT_DOCS_PATH` variable in the `.env` file.

For the other env variables, you can ask the team for the values.

## Development

Start the development server in the `docs/` directory of the framework.

```bash
yarn dev
```

## Production

Build the application for production:

```bash
yarn build
```
