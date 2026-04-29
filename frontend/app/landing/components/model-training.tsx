"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypographyLarge, TypographyMuted } from "@/components/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchModelTrainingPreview } from "@/services/model-training";
import { DataTableProps } from "@/types/import";
import { ModelTrainingPreview } from "@/types/model-training";
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";

const TEST_SIZE_OPTIONS = [0.2, 0.25, 0.3];

export default function ModelTraining({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [testSize, setTestSize] = useState(0.2);
  const [preview, setPreview] = useState<ModelTrainingPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [page, setPage] = useState(1);

  const hasDataset =
    !isLoading &&
    !!file &&
    !!dataset &&
    dataset.headers.length > 0 &&
    dataset.rows.length > 0;
  const canTrain = hasDataset && !!dataset && dataset.headers.length > 1;

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Model Training</TypographyLarge>
      <TypographyMuted>
        Compare KNN, SVM, and ANN using the selected features and target.
      </TypographyMuted>
    </div>
  );

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

      return () => {
        isCancelled = true;
      };
    }

    if (dataset.headers.length === 1) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return;
        }

        setSelectedFeatures([]);
        setTargetIndex(null);
        setPreview(null);
        setPreviewError(
          "Model training requires at least two columns: one feature and one target.",
        );
      });

      return () => {
        isCancelled = true;
      };
    }

    const totalHeaders = dataset.headers.length;

    Promise.resolve().then(() => {
      if (isCancelled) {
        return;
      }

      if (totalHeaders === 1) {
        setSelectedFeatures([0]);
        setTargetIndex(0);
        return;
      }

      setSelectedFeatures(
        Array.from({ length: totalHeaders - 1 }, (_, index) => index),
      );
      setTargetIndex(totalHeaders - 1);
    });

    return () => {
      isCancelled = true;
    };
  }, [dataset, hasDataset]);

  const sortedFeatures = useMemo(
    () => [...selectedFeatures].sort((left, right) => left - right),
    [selectedFeatures],
  );

  useEffect(() => {
    let isCancelled = false;

    if (!hasDataset || !dataset || targetIndex === null) {
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
    });

    fetchModelTrainingPreview(dataset, sortedFeatures, targetIndex, testSize)
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
  }, [dataset, hasDataset, sortedFeatures, targetIndex, testSize]);

  const toggleFeature = useCallback((index: number) => {
    setSelectedFeatures((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }

      return [...current, index];
    });
  }, []);

  if (!hasDataset || !dataset || !canTrain) {
    return null;
  }

  const totalPages = Math.max(
    Math.ceil((preview?.results.length ?? 0) / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const pageItems = getPageItems(totalPages, activePage);
  const activeResults = (preview?.results ?? []).slice(
    startIndex,
    startIndex + CLEANED_PREVIEW_ROWS,
  );
  const bestResult =
    preview?.results.find((result) => result.isBestModel) ?? null;

  return (
    <section className="mx-auto mt-6 max-w-7xl space-y-4">
      {sectionHeader}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Training Inputs</CardTitle>
          <CardDescription>
            Choose which columns are used as features and which one is the
            target.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dataset.headers.map((header, index) => (
              <div
                key={`${header}-${index}`}
                className="rounded-md border p-3 text-sm"
              >
                <p className="truncate font-medium">{header}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(index)}
                      onChange={() => toggleFeature(index)}
                    />
                    Feature
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="radio"
                      name="training-target-column"
                      checked={targetIndex === index}
                      onChange={() => setTargetIndex(index)}
                    />
                    Target
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-3">
            {TEST_SIZE_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={testSize === option ? "default" : "outline"}
                size="sm"
                onClick={() => setTestSize(option)}
              >
                Test {(option * 100).toFixed(0)}%
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isPreviewLoading && !preview ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Training models and preparing comparison metrics.
          </CardContent>
        </Card>
      ) : null}

      {!isPreviewLoading && previewError ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {previewError}
          </CardContent>
        </Card>
      ) : null}

      {preview ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Training Summary</CardTitle>
              <CardDescription>
                Results means one entry per model, each with its own evaluation
                metrics on the same test split.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-semibold">Rows</p>
                <p className="text-muted-foreground">
                  {preview.summary.totalRows}
                </p>
              </div>
              <div>
                <p className="font-semibold">Features</p>
                <p className="text-muted-foreground">
                  {preview.summary.featureCount}
                </p>
              </div>
              <div>
                <p className="font-semibold">Target</p>
                <p className="text-muted-foreground">
                  {preview.summary.targetHeader}
                </p>
              </div>
              <div>
                <p className="font-semibold">Test Size</p>
                <p className="text-muted-foreground">
                  {(preview.summary.testSize * 100).toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {bestResult ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Best Model</CardTitle>
                <CardDescription>
                  Highest accuracy on this split:{" "}
                  {preview.summary.bestModelName}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold">Model</p>
                  <p className="text-muted-foreground">
                    {bestResult.modelName}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Accuracy</p>
                  <p className="text-muted-foreground">
                    {bestResult.metrics.accuracy}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">F1 Score</p>
                  <p className="text-muted-foreground">
                    {bestResult.metrics.f1Score}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            {activeResults.map((result) => (
              <Card
                key={result.modelName}
                className={
                  result.isBestModel ? "ring-1 ring-primary/30" : undefined
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        #{result.rank} {result.modelName}
                      </CardTitle>
                      <CardDescription>
                        Model evaluation metrics
                      </CardDescription>
                    </div>
                    {result.isBestModel ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Best
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric label="Accuracy" value={result.metrics.accuracy} />
                    <Metric
                      label="Precision"
                      value={result.metrics.precision}
                    />
                    <Metric label="Recall" value={result.metrics.recall} />
                    <Metric label="F1 Score" value={result.metrics.f1Score} />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Train rows: {result.metrics.trainRows} • Test rows:{" "}
                    {result.metrics.testRows}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Confusion Matrix
                    </p>
                    <ConfusionMatrix matrix={result.metrics.confusionMatrix} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Prediction preview
                    </p>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Actual</TableHead>
                            <TableHead>Predicted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.predictionPreview.length > 0 ? (
                            result.predictionPreview.map((item, index) => (
                              <TableRow key={`${result.modelName}-${index}`}>
                                <TableCell>{item.actual}</TableCell>
                                <TableCell>{item.predicted}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                className="text-muted-foreground"
                              >
                                No preview predictions available.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Comparison</CardTitle>
              <CardDescription>
                Compare the three classifiers on the same dataset split.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Precision</TableHead>
                      <TableHead>Recall</TableHead>
                      <TableHead>F1 Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeResults.map((result) => (
                      <TableRow key={`comparison-${result.modelName}`}>
                        <TableCell className="font-medium">
                          #{result.rank} {result.modelName}
                          {result.isBestModel ? (
                            <span className="ml-2 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                              Best
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{result.metrics.accuracy}</TableCell>
                        <TableCell>{result.metrics.precision}</TableCell>
                        <TableCell>{result.metrics.recall}</TableCell>
                        <TableCell>{result.metrics.f1Score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(event) => {
                            event.preventDefault();
                            if (activePage > 1) {
                              setPage(activePage - 1);
                            }
                          }}
                          aria-disabled={activePage === 1}
                          className={
                            activePage === 1
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                        />
                      </PaginationItem>

                      {pageItems.map((item, index) => (
                        <PaginationItem
                          key={`training-page-${item ?? "gap"}-${index}`}
                        >
                          {item === null ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={item === activePage}
                              onClick={(event) => {
                                event.preventDefault();
                                setPage(item);
                              }}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={(event) => {
                            event.preventDefault();
                            if (activePage < totalPages) {
                              setPage(activePage + 1);
                            }
                          }}
                          aria-disabled={activePage === totalPages}
                          className={
                            activePage === totalPages
                              ? "pointer-events-none opacity-50"
                              : undefined
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value.toFixed(4)}</p>
    </div>
  );
}

function ConfusionMatrix({ matrix }: { matrix: number[][] }) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="rounded-md border p-2 text-center text-xs text-muted-foreground">
        No confusion matrix data available.
      </div>
    );
  }

  const n = matrix.length;
  const labels = Array.from({ length: n }, (_, i) => i.toString());
  const maxValue = Math.max(...matrix.flat());

  const getColorIntensity = (value: number): string => {
    const ratio = value / maxValue;
    if (ratio === 0) return "bg-slate-50";
    if (ratio < 0.25) return "bg-green-100";
    if (ratio < 0.5) return "bg-green-200";
    if (ratio < 0.75) return "bg-green-300";
    return "bg-green-400";
  };

  return (
    <div className="space-y-1 rounded-md border p-2">
      <div className="flex gap-1">
        <div className="w-6" />
        {labels.map((label) => (
          <div
            key={`col-${label}`}
            className="flex h-6 w-6 items-center justify-center text-[10px] font-semibold text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {matrix.map((row, i) => (
        <div key={`row-${i}`} className="flex gap-1">
          <div className="flex h-6 w-6 items-center justify-center text-[10px] font-semibold text-muted-foreground">
            {labels[i]}
          </div>
          {row.map((value, j) => (
            <div
              key={`cell-${i}-${j}`}
              className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium transition-colors ${getColorIntensity(value)}`}
              title={`Actual: ${labels[i]}, Predicted: ${labels[j]}, Count: ${value}`}
            >
              {value}
            </div>
          ))}
        </div>
      ))}

      <div className="border-t pt-1">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Rows:</span> Actual |{" "}
          <span className="font-semibold">Columns:</span> Predicted
        </p>
      </div>
    </div>
  );
}
