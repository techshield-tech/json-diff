// Shared color/label mapping for the three diff change types, used by both
// the change-list badges and the side-by-side line highlights so the two
// views stay visually consistent. Tool-specific.

import type { ChangeType } from './diff-algorithm';

export const CHANGE_TYPES: ChangeType[] = ['added', 'removed', 'changed'];

export const CHANGE_LABELS: Record<ChangeType, string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
};

/** Background + text + border classes for a badge/chip. */
export const CHANGE_BADGE_CLASSES: Record<ChangeType, string> = {
  added: 'bg-[var(--color-added-bg)] text-[var(--color-added)] border-[var(--color-added-border)]',
  removed:
    'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger-border)]',
  changed:
    'bg-[var(--color-changed-bg)] text-[var(--color-changed)] border-[var(--color-changed-border)]',
};

/** Background-only class for highlighting a pretty-printed source line. */
export const CHANGE_LINE_CLASSES: Record<ChangeType, string> = {
  added: 'bg-[var(--color-added-bg)]',
  removed: 'bg-[var(--color-danger-bg)]',
  changed: 'bg-[var(--color-changed-bg)]',
};
