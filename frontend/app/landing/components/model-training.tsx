"use client";

import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
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
import { DataTableProps } from "@/types/import";
import { FeatureSelectionState } from "@/types/feature-selection";
import {
  ConfusionMatrixProps,
  ModelTrainingMetricProps,
  TargetBinningStrategy,
} from "@/types/model-training";
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";
import {
  getConfusionMatrixCellClass,
  isNumericTargetColumn,
  TARGET_BINNING_OPTIONS,
  TEST_SIZE_OPTIONS,
} from "@/lib/model-training";
import { useModelTrainingPreview } from "@/hooks/use-model-training-preview";

export default function ModelTraining({
  file,
  dataset,
  isLoading = false,
  selectedFeatures,
  targetIndex,
}: DataTableProps & FeatureSelectionState) {
  const [testSize, setTestSize] = useState(0.2);
  const [targetBinningStrategy, setTargetBinningStrategy] =
    useState<TargetBinningStrategy>("auto");
  const [page, setPage] = useState(1);

  const hasDataset =
    !isLoading &&
    !!file &&
    !!dataset &&
    dataset.headers.length > 0 &&
    dataset.rows.length > 0;
  const hasSelection = selectedFeatures.length > 0 && targetIndex !== null;

  const isNumericTarget = useMemo(
    () => isNumericTargetColumn(dataset, targetIndex),
    [dataset, targetIndex],
  );

  const sortedFeatures = useMemo(
    () => [...selectedFeatures].sort((left, right) => left - right),
    [selectedFeatures],
  );

  const { preview, isPreviewLoading, previewError, displayedLoadingProgress } =
    useModelTrainingPreview({
      dataset,
      hasDataset,
      sortedFeatures,
      targetIndex,
      targetBinningStrategy,
      testSize,
    });

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Model Training</TypographyLarge>
      <TypographyMuted>
        Compare KNN, SVM, and ANN using the selected features and target.
      </TypographyMuted>
    </div>
  );

  if (!hasDataset || !dataset) {
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

      {!hasSelection ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-base font-semibold text-foreground">
              Select Features and Target
            </p>
            <p className="text-sm text-muted-foreground">
              Configure at least one feature and one target column in the
              Feature Selection section above to proceed with model training.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Training Configuration</CardTitle>
            <CardDescription>
              Features: {selectedFeatures.length} • Target:{" "}
              {targetIndex !== null ? dataset.headers[targetIndex] : "None"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
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
            {isNumericTarget ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target Binning
                </p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_BINNING_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={
                        targetBinningStrategy === option ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setTargetBinningStrategy(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {isNumericTarget ? (
              <p className="mt-3 text-xs text-muted-foreground">
                FinalGrade is numeric, so I bin it into Low, Medium, and High
                classes before running KNN, SVM, and ANN.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {isPreviewLoading && !preview ? (
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-muted/30">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center sm:p-10">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/10 bg-background/70 shadow-sm">
              <div className="absolute inset-2 rounded-full border border-dashed border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
              <Spinner className="size-8 text-primary" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Training in progress
              </p>
              <p className="text-sm text-muted-foreground">
                The models are fitting the selected split and preparing the
                comparison metrics.
              </p>
            </div>

            <div className="w-full max-w-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="uppercase tracking-wide text-muted-foreground">
                  Pipeline completion
                </span>
                <span className="tabular-nums text-primary">
                  {Math.round(displayedLoadingProgress)}%
                </span>
              </div>
              <Progress value={displayedLoadingProgress} className="h-2" />
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3">
              {[
                "Scaling features",
                "Evaluating classifiers",
                "Building confusion matrices",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground shadow-sm"
                >
                  {label}
                </div>
              ))}
            </div>
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
                <p className="font-semibold">Binning</p>
                <p className="text-muted-foreground">
                  {preview.summary.targetBinningStrategy ?? "N/A"}
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

          {isNumericTarget ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                FinalGrade is numeric, so I bin it into Low, Medium, and High
                classes before running KNN, SVM, and ANN.
              </CardContent>
            </Card>
          ) : null}

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

function Metric({ label, value }: ModelTrainingMetricProps) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value.toFixed(4)}</p>
    </div>
  );
}

function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="rounded-md border p-2 text-center text-xs text-muted-foreground">
        No confusion matrix data available.
      </div>
    );
  }

  const n = matrix.length;
  const labels = Array.from({ length: n }, (_, i) => i.toString());
  let maxValue = 0;

  for (const row of matrix) {
    for (const value of row) {
      if (value > maxValue) {
        maxValue = value;
      }
    }
  }

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
              className={`flex h-6 w-6 items-center justify-center rounded border border-border/60 text-[10px] font-medium transition-colors ${getConfusionMatrixCellClass(value, maxValue)}`}
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
