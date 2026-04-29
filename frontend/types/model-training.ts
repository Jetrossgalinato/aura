export type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  trainRows: number;
  testRows: number;
};

export type ModelTrainingResult = {
  modelName: string;
  metrics: ModelMetrics;
  predictionPreview: Array<{ actual: string; predicted: string }>;
};

export type ModelTrainingSummary = {
  totalRows: number;
  featureCount: number;
  targetHeader: string;
  testSize: number;
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
    test_size: number;
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
  }>;
};
