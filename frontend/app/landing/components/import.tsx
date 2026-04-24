"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = ["csv", "xls", "xlsx"];

type ImportProps = {
  onFileSelect?: (file: File) => void;
};

function isAcceptedFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && ACCEPTED_EXTENSIONS.includes(ext);
}

export default function Import({ onFileSelect }: ImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const handleFile = (file: File) => {
    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setError("Unsupported file type. Please upload CSV, XLS, or XLSX.");
      return;
    }

    setError("");
    setSelectedFile(file);
    onFileSelect?.(file);
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

  return (
    <section className="mt-10 max-w-3xl space-y-3 mx-auto">
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
            <h3 className="text-base font-semibold">Import your spreadsheet</h3>
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

      {selectedFile && !error ? (
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          Selected file:{" "}
          <span className="font-medium">{selectedFile.name}</span>
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
