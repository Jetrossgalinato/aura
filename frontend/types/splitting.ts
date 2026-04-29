export type SplitSummary = {
  totalRows: number;
  trainRows: number;
  testRows: number;
  trainPercentage: number;
  testPercentage: number;
};

export type DatasetSet = {
  headers: string[];
  rows: string[][];
};

export type SplittingResponse = {
  trainSet: DatasetSet;
  testSet: DatasetSet;
  summary: SplitSummary;
};
