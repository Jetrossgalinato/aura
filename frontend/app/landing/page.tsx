"use client";

import { useState } from "react";

import Header from "./components/header";
import Import from "./components/import";
import DataTable from "./components/data-table";
import { parseDatasetForTable } from "@/lib/import-utils";
import { ParsedDataset } from "@/types/import";

export default function LandingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);

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

  return (
    <div className="flex-col justify-center items-center min-h-screen">
      <Header />
      <Import onFileSelect={handleFileSelect} />
      <DataTable
        key={file?.name ?? "empty"}
        file={file}
        dataset={dataset}
        isLoading={isTableLoading}
      />
    </div>
  );
}
