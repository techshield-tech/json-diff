// Per-tool metadata. This is the ONE file (together with the `base` in
// vite.config.ts, index.html's <title>/meta tags, README.md, and everything
// under src/tool/) that changes when this template is copied to a sibling
// tool repo.

export type ToolCategory = 'JSON' | 'JWT' | 'SQL' | 'Docker' | 'Git' | 'Web';

export interface ToolConfig {
  /** Unique identifier used in embed postMessage payloads and URLs. */
  slug: string;
  /** Display name shown in the header. */
  name: string;
  /** Short description used for meta tags and listings. */
  description: string;
  /** One of the shared MMOALL tool categories. */
  category: ToolCategory;
  /** Keywords for search/SEO purposes. */
  keywords: string[];
}

export const toolConfig: ToolConfig = {
  slug: 'json-diff',
  name: 'JSON Diff',
  description:
    'Compare two JSON documents and see added, removed, and changed values — fast, free, and 100% client-side.',
  category: 'JSON',
  keywords: [
    'json diff',
    'json compare',
    'json comparison tool',
    'compare json files',
    'json patch',
    'rfc 6902',
    'json path diff',
    'online json tool',
  ],
};
