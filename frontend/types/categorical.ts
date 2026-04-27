export type ColumnEncoding = {
  columnIndex: number;
  header: string;
  mapping: Record<string, number>;
};

export type EncodedDataset = {
  headers: string[];
  rows: string[][];
  encodedColumns: ColumnEncoding[];
};
