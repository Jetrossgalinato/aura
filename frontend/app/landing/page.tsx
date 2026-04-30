"use client";

import { useCallback, useState } from "react";

import Header from "./components/header";
import Import from "./components/import";
import DataTable from "./components/data-table";
import CleanedVer from "./components/cleaned-ver";
import Categorical from "./components/categorical";
import SplitVer from "./components/split-ver";
import FeatureSelection from "./components/feature-selection";
import ModelTraining from "./components/model-training";
import { parseDatasetForTable } from "@/lib/import-utils";
import { ParsedDataset } from "@/types/import";
import { FeatureSelectionState } from "@/types/feature-selection";

export default function LandingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  const handleFileSelect = async (uploadedFile: File) => {
    setIsTableLoading(true);
    setFile(uploadedFile);
    setDataset(null);

    try {
      const parsed = await parseDatasetForTable(uploadedFile);
      setDataset(parsed);
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleImportClear = () => {
    setFile(null);
    setDataset(null);
    setIsTableLoading(false);
    setSelectedFeatures([]);
    setTargetIndex(null);
  };

  const handleSelectionChange = useCallback(
    (selection: FeatureSelectionState) => {
      setSelectedFeatures(selection.selectedFeatures);
      setTargetIndex(selection.targetIndex);
    },
    [],
  );

  return (
    <div
      className={`flex-col justify-center items-center ${
        !file ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <Header />
      <Import onFileSelect={handleFileSelect} onClear={handleImportClear} />
      <DataTable
        key={file ? `${file.name}-${file.lastModified}-${file.size}` : "empty"}
        file={file}
        dataset={dataset}
        isLoading={isTableLoading}
      />
      <CleanedVer file={file} dataset={dataset} isLoading={isTableLoading} />
      <Categorical file={file} dataset={dataset} isLoading={isTableLoading} />
      <SplitVer file={file} dataset={dataset} isLoading={isTableLoading} />
      <FeatureSelection
        file={file}
        dataset={dataset}
        isLoading={isTableLoading}
        onSelectionChange={handleSelectionChange}
      />
      <ModelTraining
        file={file}
        dataset={dataset}
        isLoading={isTableLoading}
        selectedFeatures={selectedFeatures}
        targetIndex={targetIndex}
      />
    </div>
  );
}
