export type ColumnEncoding = {
  columnIndex: number;
  header: string;
  mapping: Record<string, number>;
};

export type EncodedDataset = {
  format: string;
  headers: string[];
  rows: string[][];
  encodedColumns: ColumnEncoding[];
};

export type CategoricalPreviewApiColumnEncoding = {
  column_index: number;
  header: string;
  mapping: Record<string, number>;
};

export type CategoricalPreviewApiResponse = {
  format: string;
  headers: string[];
  rows: string[][];
  encoded_columns: CategoricalPreviewApiColumnEncoding[];
};
