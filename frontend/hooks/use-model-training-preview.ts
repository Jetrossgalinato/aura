"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchModelTrainingPreview } from "@/services/model-training";
import { ParsedDataset } from "@/types/import";
import {
  ModelTrainingPreview,
  TargetBinningStrategy,
} from "@/types/model-training";

type UseModelTrainingPreviewParams = {
  dataset: ParsedDataset | null;
  hasDataset: boolean;
  sortedFeatures: number[];
  targetIndex: number | null;
  targetBinningStrategy: TargetBinningStrategy;
  testSize: number;
};

type UseModelTrainingPreviewResult = {
  preview: ModelTrainingPreview | null;
  isPreviewLoading: boolean;
  previewError: string;
  displayedLoadingProgress: number;
};

export function useModelTrainingPreview({
  dataset,
  hasDataset,
  sortedFeatures,
  targetIndex,
  targetBinningStrategy,
  testSize,
}: UseModelTrainingPreviewParams): UseModelTrainingPreviewResult {
  const [preview, setPreview] = useState<ModelTrainingPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!hasDataset) {
      Promise.resolve().then(() => {
        setPreview(null);
        setPreviewError("");
        setLoadingProgress(0);
      });
    }
  }, [hasDataset]);

  useEffect(() => {
    let isCancelled = false;

    if (!hasDataset || !dataset || targetIndex === null) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return;
        }

        setPreview(null);
        setPreviewError("");
        setLoadingProgress(0);
      });

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
        setIsPreviewLoading(false);
        setLoadingProgress(0);
        setPreviewError("Select at least one feature column to train a model.");
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
      setLoadingProgress(0);
    });

    fetchModelTrainingPreview(
      dataset,
      sortedFeatures,
      targetIndex,
      targetBinningStrategy,
      testSize,
    )
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setPreview(response);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setPreview(null);
        setPreviewError(
          "Model training preview is unavailable. Ensure the backend is running.",
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    dataset,
    hasDataset,
    sortedFeatures,
    targetBinningStrategy,
    targetIndex,
    testSize,
  ]);

  useEffect(() => {
    if (!isPreviewLoading) {
      return;
    }

    const initialDelayId = window.setTimeout(() => {
      setLoadingProgress(8);
    }, 0);

    const intervalId = window.setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 92) {
          return 92;
        }

        const nextStep = Math.max(1.5, (100 - current) * 0.12);
        return Math.min(92, Number((current + nextStep).toFixed(1)));
      });
    }, 240);

    return () => {
      window.clearTimeout(initialDelayId);
      window.clearInterval(intervalId);
    };
  }, [isPreviewLoading]);

  const displayedLoadingProgress = useMemo(
    () => (isPreviewLoading ? loadingProgress : 0),
    [isPreviewLoading, loadingProgress],
  );

  return {
    preview,
    isPreviewLoading,
    previewError,
    displayedLoadingProgress,
  };
}
