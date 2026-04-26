export type ImportProps = {
  onFileSelect?: (file: File) => void;
  onClear?: () => void;
  isLoading?: boolean;
};

export type DatasetInfo = {
  format: string;
  mimeType: string;
  lastModified: string;
  rowCount: number | null;
  columnCount: number | null;
};

export type ParsedDataset = {
  format: string;
  headers: string[];
  rows: string[][];
};

export type CleaningSummary = {
  processedRows: number;
  removedEmptyRows: number;
  normalizedEmptyCells: number;
  trimmedCells: number;
};

export type CleaningPreviewResponse = {
  format: string;
  headers: string[];
  rows: string[][];
  summary: CleaningSummary;
};

export type DataTableProps = {
  file: File | null;
  dataset: ParsedDataset | null;
  isLoading?: boolean;
};
