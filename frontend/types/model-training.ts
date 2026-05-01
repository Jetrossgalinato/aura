export type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  trainRows: number;
  testRows: number;
};

export type RegressionMetrics = {
  mean_absolute_error: number;
  mean_squared_error: number;
  root_mean_squared_error: number;
  r2_score: number;
  evaluation_rows: number;
};

export type RegressionPreview = {
  format: string;
  selected_headers: string[];
  target_header: string;
  summary: Record<string, unknown>;
  metrics: RegressionMetrics;
  prediction_preview: Array<{ actual: string; predicted: string }>;
};

export type ModelTrainingResult = {
  modelName: string;
  metrics: ModelMetrics;
  predictionPreview: Array<{ actual: string; predicted: string }>;
  rank: number;
  isBestModel: boolean;
};

export type ModelTrainingSummary = {
  totalRows: number;
  featureCount: number;
  targetHeader: string;
  targetBinningStrategy: string | null;
  testSize: number;
  bestModelName: string;
  bestAccuracy: number;
};

export type TargetBinningStrategy = "auto" | "median" | "tertile" | "quartile";

export type ModelTrainingMetricProps = {
  label: string;
  value: number;
};

export type ConfusionMatrixProps = {
  matrix: number[][];
};

export type ModelTrainingPreview = {
  format: string;
  selectedHeaders: string[];
  targetHeader: string;
  summary: ModelTrainingSummary;
  results: ModelTrainingResult[];
};

export type ModelTrainingApiResponse = {
  format: string;
  selected_headers: string[];
  target_header: string;
  summary: {
    total_rows: number;
    feature_count: number;
    target_header: string;
    target_binning_strategy: string | null;
    test_size: number;
    best_model_name: string;
    best_accuracy: number;
  };
  results: Array<{
    model_name: string;
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      confusion_matrix: number[][];
      train_rows: number;
      test_rows: number;
    };
    prediction_preview: Array<{ actual: string; predicted: string }>;
    rank: number;
    is_best_model: boolean;
  }>;
};
