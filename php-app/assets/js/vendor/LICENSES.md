# Vendored third-party scripts

These files are the official, unmodified production/UMD builds of each
library, self-hosted here (instead of loaded from a CDN) so the app has
zero external runtime dependencies — it keeps working even on a network
that blocks third-party CDNs, which matters on free/shared hosting where
you don't control the visitor's network.

| File | Library | Version | License |
|---|---|---|---|
| `react.production.min.js` | [React](https://react.dev) | 18.3.1 | MIT — Copyright (c) Meta Platforms, Inc. and affiliates |
| `react-dom.production.min.js` | [React DOM](https://react.dev) | 18.3.1 | MIT — Copyright (c) Meta Platforms, Inc. and affiliates |
| `htm.js` | [htm](https://github.com/developit/htm) | 3.1.1 | Apache-2.0 — Copyright (c) Jason Miller |

`htm` provides JSX-like tagged-template syntax (`` html`<div>...</div>` ``)
without needing Babel or any build step — `pos-app.js` binds it to
`React.createElement` once at the top of the file.

To update a version: `npm install react@<ver> react-dom@<ver> htm@<ver>`
in a scratch directory, then copy the matching files from
`node_modules/react/umd/`, `node_modules/react-dom/umd/`, and
`node_modules/htm/dist/htm.js` over the ones here.
