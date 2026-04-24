export type ImportProps = {
  onFileSelect?: (file: File) => void;
  isLoading?: boolean;
};

export type DatasetInfo = {
  format: string;
  mimeType: string;
  lastModified: string;
  rowCount: number | null;
  columnCount: number | null;
};
