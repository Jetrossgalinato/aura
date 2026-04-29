import { ParsedDataset } from "@/types/import";
import { SplittingResponse } from "@/types/splitting";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSplittingPreview(
  dataset: ParsedDataset,
  testSize: number = 0.2,
  randomState?: number,
): Promise<SplittingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/splitting/split`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset: {
        headers: dataset.headers,
        rows: dataset.rows,
      },
      test_size: testSize,
      random_state: randomState,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch splitting preview: ${response.statusText}`,
    );
  }

  const data = await response.json();

  // Convert snake_case to camelCase for consistency with frontend types
  return {
    trainSet: data.train_set,
    testSet: data.test_set,
    summary: {
      totalRows: data.summary.total_rows,
      trainRows: data.summary.train_rows,
      testRows: data.summary.test_rows,
      trainPercentage: data.summary.train_percentage,
      testPercentage: data.summary.test_percentage,
    },
  };
}
