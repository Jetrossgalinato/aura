import { useEffect, useState } from "react";
import { fetchCategoricalPreview } from "@/services/categorical";
import { EncodedDataset } from "@/types/categorical";
import { DataTableProps } from "@/types/import";

export function useCategoricalEncoding({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const [encodedDataset, setEncodedDataset] = useState<EncodedDataset | null>(
    null,
  );
  const [isEncodingLoading, setIsEncodingLoading] = useState(false);
  const [encodingError, setEncodingError] = useState("");

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

      setIsEncodingLoading(true);
      setEncodingError("");
      setEncodedDataset(null);
    });

    fetchCategoricalPreview(dataset)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setEncodedDataset(response);
        setPage(1);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setEncodingError(
          "Categorical preview is currently unavailable. Start the backend to load encoded rows.",
        );
        setEncodedDataset(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsEncodingLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dataset, file, isLoading]);

  return {
    page,
    setPage,
    encodedDataset,
    isEncodingLoading,
    encodingError,
  };
}
