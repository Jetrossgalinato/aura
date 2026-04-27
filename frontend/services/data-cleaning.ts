import { CleaningPreviewResponse, ParsedDataset } from "@/types/import";

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");
  }

  return backendUrl;
}

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
  // Send raw parsed rows so backend can apply canonical cleaning logic.
  const response = await fetch(`${getBackendUrl()}/api/cleaning/preview`, {
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

  // Convert snake_case API payload into frontend camelCase types.
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
