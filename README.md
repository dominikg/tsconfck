# tsconfck

A utility to work with tsconfig files without depending on typescript

# Why

Because no simple official api exists and tsconfig.json isn't actual json.

# Features

- [x] find closest tsconfig.json
- [x] convert tsconfig.json to actual json and parse it
- [ ] resolve "extends"
- [ ] validate via json schema
- [x] optional native parse

# Develop

This repo uses

- [pnpm](https://pnpm.io)
- [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint#what-is-commitlint)

In addition to default commit-msg prefixes you can use 'wip: ' for commit messages in branches.
PRs are going to be squash-merged

```shell
# install dependencies
pnpm install
# run build in watch mode
pnpm dev
# run tests
pnpm test
#run tests in watch mode (doesn't require dev in parallel)
pnpm test:watch
```
