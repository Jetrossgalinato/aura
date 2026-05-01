import { useRef, useState } from "react";
import { useAlert } from "@/components/alert-context";
import { buildDatasetInfo, isAcceptedFile } from "@/lib/import-utils";
import { DatasetInfo } from "@/types/import";

interface UseFileImportProps {
  onFileSelect?: (file: File) => void;
  onClear?: () => void;
}

export function useFileImport({ onFileSelect, onClear }: UseFileImportProps) {
  const { showAlert } = useAlert();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [error, setError] = useState<string>("");

  const handleFile = async (file: File) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    const accepted = await isAcceptedFile(file);

    if (!accepted) {
      if (requestId === requestIdRef.current) {
        setSelectedFile(null);
        setDatasetInfo(null);
        setError("Unsupported file type. Please upload CSV, XLS, or XLSX.");
        showAlert({
          title: "Upload failed",
          description: "Unsupported file type. Please use CSV, XLS, or XLSX.",
          variant: "destructive",
        });
        onClear?.();
      }
      return;
    }

    const info = await buildDatasetInfo(file);

    if (requestId !== requestIdRef.current) {
      return;
    }

    setError("");
    setSelectedFile(file);
    onFileSelect?.(file);
    setDatasetInfo(info);
    showAlert({
      title: "File uploaded",
      description: `${file.name} is ready for preview.`,
      variant: "success",
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
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

  const clearSelectedFile = () => {
    const hadSelection = Boolean(selectedFile || datasetInfo || error);

    requestIdRef.current += 1;
    setSelectedFile(null);
    setDatasetInfo(null);
    setError("");

    if (hadSelection) {
      showAlert({
        title: "Selection cleared",
        description: "Uploaded file and dataset preview were removed.",
        variant: "success",
      });
    }

    onClear?.();
  };

  return {
    inputRef,
    isDragging,
    setIsDragging,
    selectedFile,
    datasetInfo,
    error,
    handleInputChange,
    handleDrop,
    clearSelectedFile,
  };
}
