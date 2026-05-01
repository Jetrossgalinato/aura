"use client";

import { FileSpreadsheet, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/import-utils";
import { ImportProps } from "@/types/import";
import { cn } from "@/lib/utils";
import { useFileImport } from "@/hooks/useFileImport";

export default function Import({
  onFileSelect,
  onClear,
  isLoading = false,
}: ImportProps) {
  const {
    inputRef,
    isDragging,
    setIsDragging,
    selectedFile,
    datasetInfo,
    error,
    handleInputChange,
    handleDrop,
    clearSelectedFile,
  } = useFileImport({ onFileSelect, onClear });

  if (isLoading) {
    return (
      <section className="mx-auto mt-10 max-w-4xl space-y-3">
        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-52" />
              </div>
              <Skeleton className="mt-2 h-8 w-28 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-full rounded-md" />
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 max-w-4xl space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={handleInputChange}
        className="hidden"
      />

      {selectedFile && !error ? (
        <Card>
          <CardContent className="space-y-3 px-4 py-3 text-sm">
            <p className="text-center">
              <span className="font-medium">Selected file:</span>{" "}
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>

            <div className="flex justify-center gap-2">
              <Button type="button" onClick={() => inputRef.current?.click()}>
                <Upload />
                Change file
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearSelectedFile}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedFile && !error && datasetInfo ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-base">
              Dataset information
            </CardTitle>
            <CardDescription className="text-center">
              Basic metadata for the uploaded dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 text-sm">
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
          </CardContent>
        </Card>
      ) : null}

      {!selectedFile ? (
        <Card
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
            "border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50",
          )}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-3">
              <FileSpreadsheet className="size-10 text-primary" />

              <div className="space-y-1 text-center">
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

              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2"
              >
                <Upload />
                Upload file
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="px-4 py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
