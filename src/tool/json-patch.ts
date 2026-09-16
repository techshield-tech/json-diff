// Pure conversion from computed diff entries to an RFC 6902 JSON Patch
// document. Tool-specific. Note this uses JSON Pointer syntax (e.g. "/a/2"),
// which is different from the JSONPath-like display strings (e.g. "$.a[2]")
// used in the change list — DiffEntry carries both.

import type { DiffEntry } from './diff-algorithm';

export interface JsonPatchOp {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: unknown;
}

/** Converts diff entries into an RFC 6902 JSON Patch document (array of ops). */
export function toJsonPatch(entries: DiffEntry[]): JsonPatchOp[] {
  return entries.map((entry): JsonPatchOp => {
    if (entry.type === 'added') {
      return { op: 'add', path: entry.pointer, value: entry.right };
    }
    if (entry.type === 'removed') {
      return { op: 'remove', path: entry.pointer };
    }
    return { op: 'replace', path: entry.pointer, value: entry.right };
  });
}
