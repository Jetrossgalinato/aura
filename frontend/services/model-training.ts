import { ParsedDataset } from "@/types/import";
import {
  ModelTrainingApiResponse,
  ModelTrainingPreview,
} from "@/types/model-training";

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");
  }

  return backendUrl;
}

export async function fetchModelTrainingPreview(
  dataset: ParsedDataset,
  featureIndices: number[],
  targetIndex: number,
  testSize = 0.2,
): Promise<ModelTrainingPreview> {
  const response = await fetch(
    `${getBackendUrl()}/api/model-training/preview`,
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
        test_size: testSize,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch model training preview from backend");
  }

  const payload = (await response.json()) as ModelTrainingApiResponse;

  return {
    format: payload.format,
    selectedHeaders: payload.selected_headers,
    targetHeader: payload.target_header,
    summary: {
      totalRows: payload.summary.total_rows,
      featureCount: payload.summary.feature_count,
      targetHeader: payload.summary.target_header,
      testSize: payload.summary.test_size,
      bestModelName: payload.summary.best_model_name,
      bestAccuracy: payload.summary.best_accuracy,
    },
    results: payload.results.map((result) => ({
      modelName: result.model_name,
      metrics: {
        accuracy: result.metrics.accuracy,
        precision: result.metrics.precision,
        recall: result.metrics.recall,
        f1Score: result.metrics.f1_score,
        confusionMatrix: result.metrics.confusion_matrix,
        trainRows: result.metrics.train_rows,
        testRows: result.metrics.test_rows,
      },
      predictionPreview: result.prediction_preview,
      rank: result.rank,
      isBestModel: result.is_best_model,
    })),
  };
}
