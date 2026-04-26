import { CleaningPreviewResponse, ParsedDataset } from "@/types/import";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

type CleaningPreviewApiResponse = {
  format: string;
  headers: string[];
  rows: string[][];
  summary: {
    processed_rows: number;
    removed_empty_rows: number;
    normalized_empty_cells: number;
    trimmed_cells: number;
  };
};

export async function fetchCleanedPreview(
  dataset: ParsedDataset,
): Promise<CleaningPreviewResponse> {
  const response = await fetch(`${BACKEND_URL}/api/cleaning/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset: {
        format: dataset.format,
        headers: dataset.headers,
        rows: dataset.rows,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cleaned preview from backend");
  }

  const payload = (await response.json()) as CleaningPreviewApiResponse;

  return {
    format: payload.format,
    headers: payload.headers,
    rows: payload.rows,
    summary: {
      processedRows: payload.summary.processed_rows,
      removedEmptyRows: payload.summary.removed_empty_rows,
      normalizedEmptyCells: payload.summary.normalized_empty_cells,
      trimmedCells: payload.summary.trimmed_cells,
    },
  };
}
