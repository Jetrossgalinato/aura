import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFeatureSelectionPreview } from "@/services/feature-selection";
import { DataTableProps } from "@/types/import";
import {
  FeatureSelectionPreview,
  FeatureSelectionState,
} from "@/types/feature-selection";

export type UseFeatureSelectionProps = DataTableProps & {
  onSelectionChange?: (selection: FeatureSelectionState) => void;
};

export function useFeatureSelection({
  file,
  dataset,
  isLoading = false,
  onSelectionChange,
}: UseFeatureSelectionProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<FeatureSelectionPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [page, setPage] = useState(1);

  const hasDataset =
    !isLoading &&
    !!file &&
    !!dataset &&
    dataset.headers.length > 0 &&
    dataset.rows.length > 0;

  useEffect(() => {
    let isCancelled = false;

    if (!hasDataset || !dataset) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return;
        }

        setSelectedFeatures([]);
        setTargetIndex(null);
        setPreview(null);
        setPage(1);
      });

      return;
    }

    Promise.resolve().then(() => {
      if (isCancelled) {
        return;
      }

      setSelectedFeatures([]);
      setTargetIndex(null);
    });

    return () => {
      isCancelled = true;
    };
  }, [dataset, hasDataset]);

  useEffect(() => {
    onSelectionChange?.({ selectedFeatures, targetIndex });
  }, [onSelectionChange, selectedFeatures, targetIndex]);

  const sortedFeatures = useMemo(
    () => [...selectedFeatures].sort((a, b) => a - b),
    [selectedFeatures],
  );

  useEffect(() => {
    let isCancelled = false;

    if (!hasDataset || !dataset) {
      return () => {
        isCancelled = true;
      };
    }

    if (sortedFeatures.length === 0) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return;
        }

        setPreview(null);
        setPreviewError("Select at least one feature column to continue.");
      });

      return () => {
        isCancelled = true;
      };
    }

    Promise.resolve().then(() => {
      if (isCancelled) {
        return;
      }

      setIsPreviewLoading(true);
      setPreviewError("");
      setPreview(null);
    });

    fetchFeatureSelectionPreview(dataset, sortedFeatures, targetIndex)
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setPreview(response);
        setPage(1);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setPreviewError(
          "Feature selection preview is unavailable. Ensure the backend is running.",
        );
        setPreview(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dataset, hasDataset, sortedFeatures, targetIndex]);

  const toggleFeature = useCallback((index: number) => {
    setSelectedFeatures((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }

      return [...current, index];
    });
  }, []);

  return {
    selectedFeatures,
    targetIndex,
    setTargetIndex,
    preview,
    isPreviewLoading,
    previewError,
    page,
    setPage,
    hasDataset,
    sortedFeatures,
    toggleFeature,
  };
}
