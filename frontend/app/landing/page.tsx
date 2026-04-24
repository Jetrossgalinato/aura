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

  const handleFileSelect = async (uploadedFile: File) => {
    setFile(uploadedFile);
    const parsed = await parseDatasetForTable(uploadedFile);
    setDataset(parsed);
  };

  return (
    <div className="flex-col justify-center items-center min-h-screen">
      <Header />
      <Import onFileSelect={handleFileSelect} />
      <DataTable file={file} dataset={dataset} />
    </div>
  );
}
