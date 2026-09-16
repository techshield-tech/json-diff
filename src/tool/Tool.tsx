import { useCallback, useMemo, useState } from 'react';
import { Button, CopyButton, ErrorBox, Panel, Select, TextArea, Toolbar } from '../shell/ui';
import { diffJson, type ChangeType, type DiffEntry } from './diff-algorithm';
import { toJsonPatch } from './json-patch';
import { buildLineHighlights, prettyPrintWithRanges } from './pretty-print';
import { parseJsonSafe } from './parse';
import { SAMPLE_LEFT, SAMPLE_RIGHT } from './sample';
import { CHANGE_BADGE_CLASSES, CHANGE_LABELS, CHANGE_LINE_CLASSES, CHANGE_TYPES } from './change-colors';

type ViewMode = 'list' | 'side-by-side';

const VIEW_OPTIONS = [
  { value: 'list', label: 'Change list' },
  { value: 'side-by-side', label: 'Side-by-side' },
];

function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

function previewValue(value: unknown): string {
  const json = JSON.stringify(value);
  return json.length > 80 ? `${json.slice(0, 80)}…` : json;
}

function describeEntryValue(entry: DiffEntry): string {
  if (entry.type === 'added') return previewValue(entry.right);
  if (entry.type === 'removed') return previewValue(entry.left);
  return `${previewValue(entry.left)} → ${previewValue(entry.right)}`;
}

function CodeLines({
  lines,
  highlights,
}: {
  lines: string[];
  highlights: Map<number, ChangeType>;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Nothing to show.</p>;
  }
  return (
    <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] text-xs leading-relaxed">
      <code className="block font-mono">
        {lines.map((line, index) => {
          const highlight = highlights.get(index);
          return (
            <div
              key={index}
              className={`whitespace-pre px-3 py-0.5 ${highlight ? CHANGE_LINE_CLASSES[highlight] : ''}`}
            >
              {line || ' '}
            </div>
          );
        })}
      </code>
    </pre>
  );
}

export function Tool() {
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [activeTypes, setActiveTypes] = useState<Record<ChangeType, boolean>>({
    added: true,
    removed: true,
    changed: true,
  });

  const leftEmpty = leftInput.trim() === '';
  const rightEmpty = rightInput.trim() === '';

  const leftParsed = useMemo(() => parseJsonSafe(leftInput), [leftInput]);
  const rightParsed = useMemo(() => parseJsonSafe(rightInput), [rightInput]);

  const hasDiff = leftParsed.ok && rightParsed.ok && !leftEmpty && !rightEmpty;

  const diffEntries = useMemo<DiffEntry[]>(() => {
    if (!leftParsed.ok || !rightParsed.ok || leftEmpty || rightEmpty) return [];
    return diffJson(leftParsed.value, rightParsed.value, { ignoreArrayOrder });
  }, [leftParsed, rightParsed, leftEmpty, rightEmpty, ignoreArrayOrder]);

  const counts = useMemo(() => {
    const result: Record<ChangeType, number> = { added: 0, removed: 0, changed: 0 };
    for (const entry of diffEntries) result[entry.type] += 1;
    return result;
  }, [diffEntries]);

  const activeTypesSet = useMemo(
    () => new Set<ChangeType>(CHANGE_TYPES.filter((type) => activeTypes[type])),
    [activeTypes],
  );

  const filteredEntries = useMemo(
    () => diffEntries.filter((entry) => activeTypes[entry.type]),
    [diffEntries, activeTypes],
  );

  const leftPretty = useMemo(
    () => (leftParsed.ok ? prettyPrintWithRanges(leftParsed.value) : null),
    [leftParsed],
  );
  const rightPretty = useMemo(
    () => (rightParsed.ok ? prettyPrintWithRanges(rightParsed.value) : null),
    [rightParsed],
  );

  const leftHighlights = useMemo(
    () =>
      leftPretty
        ? buildLineHighlights(diffEntries, 'left', leftPretty.ranges, activeTypesSet)
        : new Map<number, ChangeType>(),
    [diffEntries, leftPretty, activeTypesSet],
  );
  const rightHighlights = useMemo(
    () =>
      rightPretty
        ? buildLineHighlights(diffEntries, 'right', rightPretty.ranges, activeTypesSet)
        : new Map<number, ChangeType>(),
    [diffEntries, rightPretty, activeTypesSet],
  );

  const handleSwap = useCallback(() => {
    setLeftInput(rightInput);
    setRightInput(leftInput);
  }, [leftInput, rightInput]);

  const handleLoadSample = useCallback(() => {
    setLeftInput(SAMPLE_LEFT);
    setRightInput(SAMPLE_RIGHT);
  }, []);

  const toggleType = useCallback((type: ChangeType) => {
    setActiveTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button variant="ghost" onClick={handleSwap}>
          Swap sides
        </Button>
        <Button variant="ghost" onClick={handleLoadSample}>
          Load sample
        </Button>
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-fg)]">
          <input
            type="checkbox"
            checked={ignoreArrayOrder}
            onChange={(event) => setIgnoreArrayOrder(event.target.checked)}
          />
          Ignore array order
        </label>
        <Select
          aria-label="View"
          value={view}
          onChange={(event) => setView(event.target.value as ViewMode)}
          options={VIEW_OPTIONS}
        />
      </Toolbar>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title="Left"
          actions={<span className="text-xs text-[var(--color-muted)]">{byteSize(leftInput)} bytes</span>}
        >
          <TextArea
            aria-label="Left JSON"
            value={leftInput}
            onChange={(event) => setLeftInput(event.target.value)}
            placeholder="Paste left JSON here…"
            className="min-h-[200px]"
          />
          {!leftEmpty && !leftParsed.ok && <ErrorBox>{leftParsed.error}</ErrorBox>}
        </Panel>

        <Panel
          title="Right"
          actions={<span className="text-xs text-[var(--color-muted)]">{byteSize(rightInput)} bytes</span>}
        >
          <TextArea
            aria-label="Right JSON"
            value={rightInput}
            onChange={(event) => setRightInput(event.target.value)}
            placeholder="Paste right JSON here…"
            className="min-h-[200px]"
          />
          {!rightEmpty && !rightParsed.ok && <ErrorBox>{rightParsed.error}</ErrorBox>}
        </Panel>
      </div>

      {!hasDiff && (
        <p className="text-sm text-[var(--color-muted)]">
          {leftEmpty || rightEmpty
            ? 'Enter JSON on both sides to see the diff.'
            : 'Fix the JSON error(s) above to see the diff.'}
        </p>
      )}

      {hasDiff && (
        <>
          <Toolbar>
            <span className="text-sm text-[var(--color-fg)]">
              {counts.added} added, {counts.removed} removed, {counts.changed} changed
            </span>
            {CHANGE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity ${CHANGE_BADGE_CLASSES[type]} ${activeTypes[type] ? '' : 'opacity-40'}`}
              >
                {CHANGE_LABELS[type]} ({counts[type]})
              </button>
            ))}
            <CopyButton
              getText={() => JSON.stringify(toJsonPatch(diffEntries), null, 2)}
              label="Copy diff as JSON Patch"
            />
          </Toolbar>

          {view === 'list' ? (
            <Panel title="Changes">
              {filteredEntries.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No changes match the current filter.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filteredEntries.map((entry, index) => (
                    <li
                      key={`${entry.pointer}-${index}`}
                      className="flex flex-col gap-1 rounded-md border border-[var(--color-border)] p-2 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span
                        className={`inline-flex w-fit shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CHANGE_BADGE_CLASSES[entry.type]}`}
                      >
                        {CHANGE_LABELS[entry.type]}
                      </span>
                      <code className="shrink-0 break-all font-mono text-xs text-[var(--color-fg)]">
                        {entry.path}
                      </code>
                      <span className="break-all font-mono text-xs text-[var(--color-muted)]">
                        {describeEntryValue(entry)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Panel title="Left (pretty-printed)">
                <CodeLines lines={leftPretty?.lines ?? []} highlights={leftHighlights} />
              </Panel>
              <Panel title="Right (pretty-printed)">
                <CodeLines lines={rightPretty?.lines ?? []} highlights={rightHighlights} />
              </Panel>
            </div>
          )}
        </>
      )}
    </div>
  );
}
