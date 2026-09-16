# JSON Diff

Compare two JSON documents and see added, removed, and changed values — fast, free, and 100% client-side. Your input is never sent over the network; everything runs in your browser.

**Live:** https://techshield-tech.github.io/json-diff/

Part of [MMOALL Developer Tools](https://mmoall.com/tools).
Also available at [mmoall.com/tools/json-diff](https://mmoall.com/tools/json-diff).

## Features

- Two JSON text inputs (left/right) with a structural diff computed entirely
  in TypeScript — no external diff library.
- Change list view: added / removed / changed entries with colored badges,
  a JSONPath-like path per entry (e.g. `$.profile.age`), filterable by change
  type, with a live count per type (e.g. "2 added, 2 removed, 2 changed").
- Side-by-side view: both sides pretty-printed with changed lines
  highlighted in matching colors, best-effort mapped from each diff entry's
  path to the line(s) it occupies.
- "Ignore array order" toggle (off by default): off compares arrays
  element-by-index; on does a best-effort, order-insensitive (multiset-style)
  match of array elements.
- Object key order is always ignored — objects are compared by key set, not
  declaration order.
- "Swap sides" to swap the left/right input content.
- "Load sample" to populate both sides with a related pair of JSON documents
  that already differ (an added key, a removed key, a changed value, and
  array differences).
- "Copy diff as JSON Patch" — converts the computed diff into an
  [RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902) JSON Patch
  document (`add`/`remove`/`replace` ops using JSON Pointer paths, e.g.
  `/profile/age`) and copies it to the clipboard, pretty-printed.
- Responsive down to 360px viewport width.

## Embedding

This tool can be embedded in an iframe, e.g. on mmoall.com. In embed mode it
renders only the tool itself (no header/footer) on a transparent background.

```html
<iframe
  id="json-diff"
  src="https://techshield-tech.github.io/json-diff/?embed=1&theme=dark"
  style="width: 100%; border: 0;"
  title="JSON Diff"
></iframe>

<script>
  const iframe = document.getElementById('json-diff');

  // Resize the iframe to fit its content.
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.type === 'mmoall-tool:height' && data.slug === 'json-diff') {
      iframe.style.height = `${data.height}px`;
    }
    if (data && data.type === 'mmoall-tool:ready' && data.slug === 'json-diff') {
      // The tool has mounted and is ready.
    }
  });

  // Push a theme change into the iframe (only accepted from an allowed origin).
  iframe.contentWindow.postMessage({ type: 'mmoall-tool:theme', theme: 'dark' }, '*');
</script>
```

### Contract

- `?embed=1` in the URL renders only the tool (no chrome), transparent
  background.
- `?theme=light` / `?theme=dark` sets the initial theme; otherwise it follows
  `prefers-color-scheme`.
- The page listens for `window.postMessage({type:'mmoall-tool:theme', theme})`
  from the parent frame to change theme at runtime. Only messages whose
  `event.origin` is `https://mmoall.com`, `https://www.mmoall.com`, or
  `http://localhost:3000` are accepted.
- On mount (embed mode only), the page posts
  `{type:'mmoall-tool:ready', slug:'json-diff'}` to `window.parent`.
- Whenever its rendered height changes (embed mode only), the page posts
  `{type:'mmoall-tool:height', slug:'json-diff', height}` to
  `window.parent`.

## Local development

```bash
bun install
bun dev
```

Build for production:

```bash
bun run build
```

Deployment to GitHub Pages happens automatically via
`.github/workflows/deploy.yml` on every push to `main`.

## License

MIT — see [LICENSE](./LICENSE).
