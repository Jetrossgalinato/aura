import { useEffect, useState } from "react";
import { fetchCleanedPreview } from "@/services/data-cleaning";
import { CleaningSummary, DataTableProps, ParsedDataset } from "@/types/import";

export function useCleanedData({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const [cleanedDataset, setCleanedDataset] = useState<ParsedDataset | null>(
    null,
  );
  const [summary, setSummary] = useState<CleaningSummary | null>(null);
  const [isCleaningLoading, setIsCleaningLoading] = useState(false);
  const [cleaningError, setCleaningError] = useState("");

  useEffect(() => {
    // Re-run cleaning every time a new parsed dataset is selected.
    let isCancelled = false;

    if (
      isLoading ||
      !file ||
      !dataset ||
      dataset.headers.length === 0 ||
      dataset.rows.length === 0
    ) {
      return () => {
        isCancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (isCancelled) {
        return;
      }

      // Reset current preview before requesting fresh cleaned rows.
      setIsCleaningLoading(true);
      setCleaningError("");
      setCleanedDataset(null);
      setSummary(null);
    });

    fetchCleanedPreview(dataset)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setCleanedDataset({
          format: response.format,
          headers: response.headers,
          rows: response.rows,
        });
        setSummary(response.summary);
        setPage(1);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        // Keep UI informative when backend service is not running or unreachable.
        setCleaningError(
          "Cleaning service is currently unavailable. Start the backend to load cleaned rows.",
        );
        setCleanedDataset(null);
        setSummary(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCleaningLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dataset, file, isLoading]);

  return {
    page,
    setPage,
    cleanedDataset,
    summary,
    isCleaningLoading,
    cleaningError,
  };
}
