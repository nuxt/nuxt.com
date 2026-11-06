# Prototype dependencies

`eve-raycast-0.0.0-prototype.2.tgz` is the unpublished Raycast Eve extension built in the separate local repository `~/Dev/eve-raycast`. It is an npm package archive, not a global npm link. Both Nuxi manifests reference this file, and the root pnpm lockfile pins its integrity so previews install the same build.

- SHA-256: `515d0a6862a4fc768b9edc09a5fd88c0c8f2130d1c6ee2bae9a831629881fb4b`
- Built with Eve 0.91.0 / Node 24+
- Includes compiled extension files, type declarations and package documentation; no credentials or local dependencies.
- Public API: `eve-raycast`, `eve-raycast/channel`, `eve-raycast/protocol`.

To rebuild after editing the source repository:

```sh
cd ~/Dev/eve-raycast
npm run typecheck
npm test
npm run build
npm pack --pack-destination /path/to/nuxt.com/vendor
```

Bump the prototype version for each replacement. Update both manifests, run `pnpm install --lockfile-only --ignore-scripts` at the Nuxt repository root, and update this checksum. The archive's implementation and declarations can be inspected with `tar -xzf vendor/eve-raycast-0.0.0-prototype.2.tgz -C /tmp/your-empty-directory`.

Mounting this extension changes the Eve channel name from `raycast` to `raycast__raycast`. Start a new Raycast chat; existing conversations are not migrated. This prototype package is not published to npm.
