'use client';

import * as React from 'react';

export type DiffViewProps = {
  oldText: string;
  newText: string;
};

function computeDiffLines(
  oldStr: string,
  newStr: string,
): { type: 'context' | 'add' | 'del'; text: string }[] {
  const oldLines = oldStr.split(/\r?\n/);
  const newLines = newStr.split(/\r?\n/);
  // Simple LCS-based line diff (minimal impl for UI)
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    const below = dp[i + 1] as number[]; // exists because dp has m+1 rows
    const row = dp[i] as number[];
    for (let j = n - 1; j >= 0; j--) {
      const diag = below[j + 1] ?? 0; // dp[i+1][j+1]
      const down = below[j] ?? 0; // dp[i+1][j]
      const right = row[j + 1] ?? 0; // dp[i][j+1]
      if (oldLines[i] === newLines[j]) row[j] = diag + 1;
      else row[j] = Math.max(down, right);
    }
  }
  const result: { type: 'context' | 'add' | 'del'; text: string }[] = [];
  let i = 0,
    j = 0;
  while (i < m && j < n) {
    const o = oldLines[i] ?? '';
    const nline = newLines[j] ?? '';
    if (o === nline) {
      result.push({ type: 'context', text: o });
      i++;
      j++;
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) {
      result.push({ type: 'del', text: o });
      i++;
    } else {
      result.push({ type: 'add', text: nline });
      j++;
    }
  }
  while (i < m) {
    const o = oldLines[i] ?? '';
    result.push({ type: 'del', text: o });
    i++;
  }
  while (j < n) {
    const nline = newLines[j] ?? '';
    result.push({ type: 'add', text: nline });
    j++;
  }
  return result;
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const lines = React.useMemo(
    () => computeDiffLines(oldText, newText),
    [oldText, newText],
  );
  return (
    <pre className="text-xs whitespace-pre-wrap rounded border bg-background overflow-auto p-2">
      {lines.map((l, idx) => (
        <div
          key={idx}
          className={
            l.type === 'add'
              ? 'bg-emerald-50 dark:bg-emerald-950/30'
              : l.type === 'del'
                ? 'bg-rose-50 dark:bg-rose-950/30'
                : ''
          }
        >
          <span className="select-none mr-2 text-muted-foreground">
            {l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '}
          </span>
          <span>{l.text}</span>
        </div>
      ))}
    </pre>
  );
}
