# How to contribute

This repo uses

- [pnpm](https://pnpm.io)
- [changesets](https://github.com/changesets/changesets)

If you changed jsdoc, generate types and docs with `pnpm generate`
In every PR you have to add a changeset by running `pnpm changeset` and following the prompts.

PRs are going to be squash-merged

```shell
# install dependencies
pnpm install
# run tests
pnpm test
# generate docs and types
pnpm generate
# create changeset
pnpm changeset
```
