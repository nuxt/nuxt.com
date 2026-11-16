# Nuxt + eve: issue triage

An issue triage agent built with [eve](https://eve.dev) and served by a Nuxt app with the `eve/nuxt` module.

Built by [Chad Hietala](https://github.com/chadhietala), first proposed in [nuxt/examples#270](https://github.com/nuxt/examples/pull/270). It is the Nuxt counterpart of the Next.js eve example.

A decision model gives every issue a category and a priority in one step. Only the issues it is less than 70% sure about go to a `reviewer` subagent, one fresh session each. The page streams the run as it happens.

## What's inside

- `nuxt.config.ts`: the `eve/nuxt` module serves the agent at `/eve/v1/*`, on the app's origin.
- `agent/tools/triage_issues.ts`: the triage workflow tool.
- `agent/lib/decide.ts`: the decision model step.
- `agent/subagents/reviewer/`: the reviewer subagent.
- `agent/lib/sample-issues.ts`: the six sample issues. Replace `agent/lib/issues.ts` to load your own.
- `agent/channels/eve.ts`: who can call the agent.
- `app/components/Triage.vue`: the triage console, built with the auto-imported `useEveAgent` composable.

## Setup

The agent calls its models through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway). Copy `.env.example` to `.env` and set `AI_GATEWAY_API_KEY`, then:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and select **Run triage**. To send more issues to the reviewer, raise `CONFIDENCE_THRESHOLD` in `agent/lib/triage.ts`.

## Deploy

Deploy to [Vercel](https://vercel.com): the `eve/nuxt` module deploys the agent as its own service next to the app, and on Vercel the AI Gateway authenticates with OIDC.

`agent/channels/eve.ts` ends with `none()`, so a deployment accepts anonymous requests and spends your AI Gateway credits. Replace it with your app's auth before you deploy. See [Auth & route protection](https://eve.dev/docs/guides/auth-and-route-protection).

## Learn more

- [eve with Nuxt](https://eve.dev/docs/guides/frontend/nuxt)
- [Nuxt documentation](https://nuxt.com/docs)
