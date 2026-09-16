// Shared JSON Pointer (RFC 6901) and JSONPath-like helpers. Pure,
// framework-free. Used by both the diff algorithm and the pretty-printer so
// the two always agree on the exact same path string for the same location.
// Tool-specific.

export type PathSegment = string | number;

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Escapes a single JSON Pointer segment per RFC 6901 (~ -> ~0, / -> ~1). */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Appends one segment to a JSON Pointer string, e.g. ("/a", "b") -> "/a/b". */
export function joinPointer(parent: string, segment: PathSegment): string {
  return `${parent}/${escapePointerSegment(String(segment))}`;
}

/** Builds a full JSON Pointer (RFC 6901) from a segment list, e.g. ["a", "b", 2] -> "/a/b/2". */
export function toJsonPointer(segments: PathSegment[]): string {
  return segments.reduce<string>((pointer, segment) => joinPointer(pointer, segment), '');
}

/** Builds a JSONPath-like display string from a segment list, e.g. ["a", "b", 2] -> "$.a.b[2]". */
export function toJsonPath(segments: PathSegment[]): string {
  let result = '$';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      result += `[${segment}]`;
    } else if (IDENTIFIER_RE.test(segment)) {
      result += `.${segment}`;
    } else {
      result += `[${JSON.stringify(segment)}]`;
    }
  }
  return result;
}
