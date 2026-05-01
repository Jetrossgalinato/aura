import { ParsedDataset } from "@/types/import";

export const TEST_SIZE_OPTIONS = [0.2, 0.25, 0.3] as const;

export const TARGET_BINNING_OPTIONS = [
  "auto",
  "median",
  "tertile",
  "quartile",
] as const;

export function isNumericTargetColumn(
  dataset: ParsedDataset | null,
  targetIndex: number | null,
): boolean {
  if (!dataset || targetIndex === null) {
    return false;
  }

  const targetValues = dataset.rows
    .map((row) => row[targetIndex] ?? "")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (targetValues.length === 0) {
    return false;
  }

  let numericCount = 0;
  const uniqueValues = new Set<string>();

  for (const value of targetValues) {
    uniqueValues.add(value);

    if (!Number.isNaN(Number(value))) {
      numericCount += 1;
    }
  }

  return numericCount / targetValues.length >= 0.9 && uniqueValues.size > 30;
}

export function getConfusionMatrixCellClass(
  value: number,
  maxValue: number,
): string {
  if (maxValue === 0) {
    return "bg-muted/60 text-muted-foreground dark:bg-muted/30";
  }

  const ratio = value / maxValue;

  if (ratio === 0) {
    return "bg-muted/60 text-muted-foreground dark:bg-muted/30";
  }

  if (ratio < 0.25) {
    return "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50";
  }

  if (ratio < 0.5) {
    return "bg-emerald-200 text-emerald-950 dark:bg-emerald-900/55 dark:text-emerald-50";
  }

  if (ratio < 0.75) {
    return "bg-emerald-300 text-emerald-950 dark:bg-emerald-800 dark:text-emerald-50";
  }

  return "bg-emerald-400 text-emerald-950 dark:bg-emerald-600 dark:text-foreground";
}
