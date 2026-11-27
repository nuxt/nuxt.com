---
description: Install and run a cloned project in the sandbox, whatever it is built with. Covers its dev server, tests, lint, type check and build, and opening its pages in the browser. Load it before the first install or run of a task, and when a server you started no longer answers.
---

The sandbox is a Linux machine with Node.js, npm, pnpm, Yarn, Bun, git, a C toolchain, ffmpeg and a browser. Install anything else a project needs with `sudo apt-get install -y`. It holds no secrets and no services: no database, no Docker, no account of any kind.

Every project runs its own way, so read how this one runs before you run it.

## Read first

In the clone, read what exists of `AGENTS.md` or `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `package.json` (`packageManager`, `scripts`, `engines`, `workspaces`) and `.env.example`. They name the package manager, the commands, and what the app needs to start.

The lockfile names the package manager when `packageManager` doesn't: `pnpm-lock.yaml` is pnpm, `yarn.lock` is Yarn, `bun.lock` or `bun.lockb` is Bun, `package-lock.json` is npm. `pnpm` and `yarn` run the version the project pins, and download it on first use.

## Install

Install with the lockfile as it is: `pnpm install --frozen-lockfile`, `yarn install --immutable` (`--frozen-lockfile` on Yarn 1), `bun install --frozen-lockfile` or `npm ci`. Prefix the command with `CI=1` so nothing waits for an answer.

- Change the lockfile only when the task adds or updates a dependency. Then run the package manager's own command and commit the lockfile it writes.
- In a monorepo, install at the root, then run the app or package the task is about the way its README shows.

## Commands that take time

`bash` waits 60 seconds for a command, or up to 120 with `timeout`. A command still running after that keeps running: the result says `running` and gives a `pid` and an `outputDirectory` that holds `stdout`, `stderr` and, once the command ends, `exit`. Read those files to follow an install, a build or a test run. Don't start the command again.

## Checks

Run the checks the project has for what you changed: its lint, its type check and the tests of that area, under the script names in `package.json`. Run the narrowest command that covers your change first, such as one test file or one package, then the wider one when it is quick enough.

- Fix what your change breaks. Never weaken a test or a lint rule to get a pass.
- A check that fails the same way on the commit you checked out is not yours to fix. Say which one, and that it fails without your change.

## Run the app

1. Start the dev script with `bash` and a `timeout` of 5, on a port you choose. Most dev servers take `--port 3000` or `PORT=3000`. The call returns `running` and the server keeps going.
2. Wait for it with `curl -s -o /dev/null -w '%{http_code}' --max-time 90 http://localhost:3000/`. A dev server compiles a page on its first request, which can take a minute. When it doesn't answer, read `stderr` in the output directory.
3. Open `http://localhost:3000/<path>` with the `browser__*` tools, `capture_screenshot` or `record_video`. Write `localhost`, not `0.0.0.0` or the address the server prints.
4. Look at the page your change touches. Read `browser__errors` and the server's `stderr` for errors your change causes.

- When the app needs environment variables to start, use the values that `.env.example` or the README give for local development. Never invent a credential. When a page needs a service the sandbox doesn't have, say which page you could not check.
- Processes end when your task ends, and the files stay. On a follow-up message, the clone and its `node_modules` are there and the server is not: start it again.
- Stop a server you no longer need with `kill -- -<pid>`. Two dev servers at once can use up the sandbox's memory.

## Say what you ran

In your reply and in the pull request, name each check you ran with its result, and each one you could not run with the reason. Quote the output of a failure. Never write that the tests pass when you did not run them.
