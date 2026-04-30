export type FeatureSelectionSummary = {
  totalColumns: number;
  selectedFeatureCount: number;
  rowCount: number;
  previewRowCount: number;
};

export type FeatureSelectionPreview = {
  format: string;
  selectedHeaders: string[];
  featureHeaders: string[];
  targetHeader: string | null;
  rows: string[][];
  summary: FeatureSelectionSummary;
};

export type FeatureSelectionState = {
  selectedFeatures: number[];
  targetIndex: number | null;
};

export type FeatureSelectionApiResponse = {
  format: string;
  selected_headers: string[];
  feature_headers: string[];
  target_header: string | null;
  rows: string[][];
  summary: {
    total_columns: number;
    selected_feature_count: number;
    row_count: number;
    preview_row_count: number;
  };
};
