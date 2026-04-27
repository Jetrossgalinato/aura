import {
  CategoricalPreviewApiResponse,
  EncodedDataset,
} from "@/types/categorical";
import { ParsedDataset } from "@/types/import";

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");
  }

  return backendUrl;
}

export async function fetchCategoricalPreview(
  dataset: ParsedDataset,
): Promise<EncodedDataset> {
  const response = await fetch(`${getBackendUrl()}/api/categorical/preview`, {
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
    throw new Error("Failed to fetch categorical preview from backend");
  }

  const payload = (await response.json()) as CategoricalPreviewApiResponse;

  return {
    format: payload.format,
    headers: payload.headers,
    rows: payload.rows,
    encodedColumns: payload.encoded_columns.map((column) => ({
      columnIndex: column.column_index,
      header: column.header,
      mapping: column.mapping,
    })),
  };
}
