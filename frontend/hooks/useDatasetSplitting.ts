import { useCallback, useEffect, useState } from "react";
import { fetchSplittingPreview } from "@/services/splitting";
import { SplitSummary, SplittingResponse } from "@/types/splitting";
import { DataTableProps } from "@/types/import";

export function useDatasetSplitting({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"train" | "test">("train");
  const [testSize, setTestSize] = useState(0.2);
  const [splitData, setSplitData] = useState<SplittingResponse | null>(null);
  const [summary, setSummary] = useState<SplitSummary | null>(null);
  const [isSplittingLoading, setIsSplittingLoading] = useState(false);
  const [splittingError, setSplittingError] = useState("");

  const handleSplitRatio = useCallback((ratio: number) => {
    setTestSize(ratio);
  }, []);

  useEffect(() => {
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

      setIsSplittingLoading(true);
      setSplittingError("");
      setSplitData(null);
      setSummary(null);
    });

    fetchSplittingPreview(dataset, testSize)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setSplitData(response);
        setSummary(response.summary);
        setPage(1);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setSplittingError(
          "Splitting service is currently unavailable. Start the backend to load split rows.",
        );
        setSplitData(null);
        setSummary(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSplittingLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dataset, file, isLoading, testSize]);

  return {
    page,
    setPage,
    activeTab,
    setActiveTab,
    testSize,
    handleSplitRatio,
    splitData,
    summary,
    isSplittingLoading,
    splittingError,
  };
}
