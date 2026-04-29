import { ParsedDataset } from "@/types/import";
import {
  FeatureSelectionApiResponse,
  FeatureSelectionPreview,
} from "@/types/feature-selection";

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");
  }

  return backendUrl;
}

export async function fetchFeatureSelectionPreview(
  dataset: ParsedDataset,
  featureIndices: number[],
  targetIndex: number | null,
): Promise<FeatureSelectionPreview> {
  const response = await fetch(
    `${getBackendUrl()}/api/feature-selection/preview`,
    {
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
        feature_indices: featureIndices,
        target_index: targetIndex,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch feature selection preview from backend");
  }

  const payload = (await response.json()) as FeatureSelectionApiResponse;

  return {
    format: payload.format,
    selectedHeaders: payload.selected_headers,
    featureHeaders: payload.feature_headers,
    targetHeader: payload.target_header,
    rows: payload.rows,
    summary: {
      totalColumns: payload.summary.total_columns,
      selectedFeatureCount: payload.summary.selected_feature_count,
      rowCount: payload.summary.row_count,
      previewRowCount: payload.summary.preview_row_count,
    },
  };
}
