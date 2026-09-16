// Tiny JSON.parse wrapper. This tool only needs to know a side failed to
// parse and why, not pinpoint the exact line/column. Tool-specific.

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };

export function parseJsonSafe(input: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
