// Pure, framework-free structural JSON diff — no external diff library.
// Tool-specific.
//
// Object key order is always ignored (objects are compared by key set).
// Arrays are compared element-by-index by default; pass
// `ignoreArrayOrder: true` for a best-effort order-insensitive comparison.

import { toJsonPath, toJsonPointer, type PathSegment } from './json-pointer';

export type ChangeType = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  type: ChangeType;
  /** JSONPath-like display path, e.g. "$.a.b[2]". */
  path: string;
  /** RFC 6901 JSON Pointer for this same location, e.g. "/a/b/2". */
  pointer: string;
  /** The old value. Present for 'removed' and 'changed' entries. */
  left?: unknown;
  /** The new value. Present for 'added' and 'changed' entries. */
  right?: unknown;
}

export interface DiffOptions {
  /** When true, array elements are matched by deep-equality rather than by index. */
  ignoreArrayOrder: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural deep-equality for parsed JSON values (object key order is ignored). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => deepEqual(value, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
    );
  }

  return false;
}

function makeEntry(
  type: ChangeType,
  segments: PathSegment[],
  left: unknown,
  right: unknown,
): DiffEntry {
  const entry: DiffEntry = {
    type,
    path: toJsonPath(segments),
    pointer: toJsonPointer(segments),
  };
  if (type !== 'added') entry.left = left;
  if (type !== 'removed') entry.right = right;
  return entry;
}

function walk(
  left: unknown,
  right: unknown,
  segments: PathSegment[],
  options: DiffOptions,
  out: DiffEntry[],
): void {
  if (deepEqual(left, right)) return;

  if (Array.isArray(left) && Array.isArray(right)) {
    diffArrays(left, right, segments, options, out);
    return;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    diffObjects(left, right, segments, options, out);
    return;
  }

  // Either a primitive changed, or the value's type/shape changed entirely
  // (e.g. an object replaced by an array) — report the whole value as changed.
  out.push(makeEntry('changed', segments, left, right));
}

function diffObjects(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  segments: PathSegment[],
  options: DiffOptions,
  out: DiffEntry[],
): void {
  const seen = new Set<string>();
  const orderedKeys = [...Object.keys(left), ...Object.keys(right)].filter((key) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const key of orderedKeys) {
    const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
    const hasRight = Object.prototype.hasOwnProperty.call(right, key);
    const childSegments = [...segments, key];

    if (hasLeft && !hasRight) {
      out.push(makeEntry('removed', childSegments, left[key], undefined));
    } else if (!hasLeft && hasRight) {
      out.push(makeEntry('added', childSegments, undefined, right[key]));
    } else {
      walk(left[key], right[key], childSegments, options, out);
    }
  }
}

function diffArrays(
  left: unknown[],
  right: unknown[],
  segments: PathSegment[],
  options: DiffOptions,
  out: DiffEntry[],
): void {
  if (options.ignoreArrayOrder) {
    diffArraysUnordered(left, right, segments, options, out);
    return;
  }

  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index++) {
    const hasLeft = index < left.length;
    const hasRight = index < right.length;
    const childSegments = [...segments, index];

    if (hasLeft && !hasRight) {
      out.push(makeEntry('removed', childSegments, left[index], undefined));
    } else if (!hasLeft && hasRight) {
      out.push(makeEntry('added', childSegments, undefined, right[index]));
    } else {
      walk(left[index], right[index], childSegments, options, out);
    }
  }
}

interface IndexedValue {
  index: number;
  value: unknown;
}

/**
 * Best-effort order-insensitive array comparison. Elements that are
 * deep-equal are matched to each other (regardless of position) and treated
 * as unchanged. Any leftover, unmatched elements are then paired up
 * positionally and diffed recursively, with surplus on either side reported
 * as added/removed. This is a pragmatic multiset-style match, not a minimal
 * edit-distance algorithm.
 */
function diffArraysUnordered(
  left: unknown[],
  right: unknown[],
  segments: PathSegment[],
  options: DiffOptions,
  out: DiffEntry[],
): void {
  const rightPool: (IndexedValue & { used: boolean })[] = right.map((value, index) => ({
    index,
    value,
    used: false,
  }));

  const unmatchedLeft: IndexedValue[] = [];
  left.forEach((value, index) => {
    const match = rightPool.find((candidate) => !candidate.used && deepEqual(candidate.value, value));
    if (match) {
      match.used = true;
    } else {
      unmatchedLeft.push({ index, value });
    }
  });

  const unmatchedRight: IndexedValue[] = rightPool
    .filter((candidate) => !candidate.used)
    .map(({ index, value }) => ({ index, value }));

  const pairCount = Math.min(unmatchedLeft.length, unmatchedRight.length);
  for (let i = 0; i < pairCount; i++) {
    walk(
      unmatchedLeft[i].value,
      unmatchedRight[i].value,
      [...segments, unmatchedLeft[i].index],
      options,
      out,
    );
  }
  for (let i = pairCount; i < unmatchedLeft.length; i++) {
    out.push(
      makeEntry('removed', [...segments, unmatchedLeft[i].index], unmatchedLeft[i].value, undefined),
    );
  }
  for (let i = pairCount; i < unmatchedRight.length; i++) {
    out.push(
      makeEntry('added', [...segments, unmatchedRight[i].index], undefined, unmatchedRight[i].value),
    );
  }
}

/** Computes a structural diff between two parsed JSON values. */
export function diffJson(left: unknown, right: unknown, options: DiffOptions): DiffEntry[] {
  const out: DiffEntry[] = [];
  walk(left, right, [], options, out);
  return out;
}
