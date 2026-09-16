// Pure pretty-printer that mirrors `JSON.stringify(value, null, 2)` output
// while also recording, for every JSON Pointer path in the value, which
// output line range that value occupies. Used to highlight diffed lines in
// the side-by-side view. Tool-specific.

import { joinPointer } from './json-pointer';
import type { ChangeType, DiffEntry } from './diff-algorithm';

export interface PrettyPrintResult {
  lines: string[];
  /** JSON Pointer -> inclusive [startLine, endLine], 0-indexed. */
  ranges: Map<string, [number, number]>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pretty-prints `value` (2-space indent) while recording each node's line range by JSON Pointer. */
export function prettyPrintWithRanges(value: unknown): PrettyPrintResult {
  const lines: string[] = [];
  const ranges = new Map<string, [number, number]>();

  function write(
    node: unknown,
    indent: number,
    pointer: string,
    prefix: string,
    suffix: string,
  ): void {
    const pad = '  '.repeat(indent);
    const startLine = lines.length;

    if (Array.isArray(node)) {
      if (node.length === 0) {
        lines.push(`${pad}${prefix}[]${suffix}`);
      } else {
        lines.push(`${pad}${prefix}[`);
        node.forEach((item, index) => {
          write(item, indent + 1, joinPointer(pointer, index), '', index === node.length - 1 ? '' : ',');
        });
        lines.push(`${pad}]${suffix}`);
      }
    } else if (isPlainObject(node)) {
      const keys = Object.keys(node);
      if (keys.length === 0) {
        lines.push(`${pad}${prefix}{}${suffix}`);
      } else {
        lines.push(`${pad}${prefix}{`);
        keys.forEach((key, index) => {
          write(
            node[key],
            indent + 1,
            joinPointer(pointer, key),
            `${JSON.stringify(key)}: `,
            index === keys.length - 1 ? '' : ',',
          );
        });
        lines.push(`${pad}}${suffix}`);
      }
    } else {
      lines.push(`${pad}${prefix}${JSON.stringify(node)}${suffix}`);
    }

    ranges.set(pointer, [startLine, lines.length - 1]);
  }

  write(value, 0, '', '', '');
  return { lines, ranges };
}

/**
 * Maps each 0-indexed pretty-printed line of one side ('left' or 'right') to
 * the ChangeType that should highlight it, based on diff entries whose type
 * is in `activeTypes`. Best-effort: each diff path highlights the full line
 * range its value occupies in that side's pretty-printed output — an added
 * entry has no line on the left, a removed entry has no line on the right.
 */
export function buildLineHighlights(
  entries: DiffEntry[],
  side: 'left' | 'right',
  ranges: Map<string, [number, number]>,
  activeTypes: ReadonlySet<ChangeType>,
): Map<number, ChangeType> {
  const highlights = new Map<number, ChangeType>();
  for (const entry of entries) {
    if (!activeTypes.has(entry.type)) continue;
    if (side === 'left' && entry.type === 'added') continue;
    if (side === 'right' && entry.type === 'removed') continue;

    const range = ranges.get(entry.pointer);
    if (!range) continue;
    for (let line = range[0]; line <= range[1]; line++) {
      highlights.set(line, entry.type);
    }
  }
  return highlights;
}
