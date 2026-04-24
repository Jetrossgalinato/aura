"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildDatasetInfo,
  formatFileSize,
  isAcceptedFile,
} from "@/lib/import-utils";
import { DatasetInfo, ImportProps } from "@/types/import";
import { cn } from "@/lib/utils";

export default function Import({
  onFileSelect,
  isLoading = false,
}: ImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [error, setError] = useState<string>("");

  const handleFile = async (file: File) => {
    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setDatasetInfo(null);
      setError("Unsupported file type. Please upload CSV, XLS, or XLSX.");
      return;
    }

    setError("");
    setSelectedFile(file);
    onFileSelect?.(file);

    const info = await buildDatasetInfo(file);
    setDatasetInfo(info);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  if (isLoading) {
    return (
      <section className="mx-auto mt-10 max-w-4xl space-y-3">
        <div className="rounded-xl border-2 border-dashed p-8">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="mt-2 h-8 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
      </section>
    );
  }

  return (
    <section className="mt-10 max-w-4xl space-y-3 mx-auto">
      {selectedFile && !error ? (
        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-center">
          <span className="font-medium">Selected file:</span>{" "}
          {selectedFile.name} ({formatFileSize(selectedFile.size)})
        </div>
      ) : null}

      {selectedFile && !error && datasetInfo ? (
        <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm">
          <p className="mb-2 text-center font-medium">Dataset information</p>
          <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Format:</span>{" "}
              {datasetInfo.format}
            </p>
            <p>
              <span className="font-medium text-foreground">MIME type:</span>{" "}
              {datasetInfo.mimeType}
            </p>
            <p>
              <span className="font-medium text-foreground">Rows:</span>{" "}
              {datasetInfo.rowCount ?? "Not available for this file type yet"}
            </p>
            <p>
              <span className="font-medium text-foreground">Columns:</span>{" "}
              {datasetInfo.columnCount ??
                "Not available for this file type yet"}
            </p>
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">
                Last modified:
              </span>{" "}
              {datasetInfo.lastModified}
            </p>
          </div>
        </div>
      ) : null}

      {!selectedFile ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50",
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="size-10 text-primary" />

            <div className="space-y-1">
              <h3 className="text-base font-semibold">
                Import your spreadsheet
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop a file here, or click upload.
              </p>
              <p className="text-xs text-muted-foreground">
                Accepted formats: .csv, .xls, .xlsx
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleInputChange}
              className="hidden"
            />

            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2"
            >
              <Upload />
              Upload file
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </section>
  );
}
