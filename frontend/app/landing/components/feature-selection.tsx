"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchFeatureSelectionPreview } from "@/services/feature-selection";
import { DataTableProps } from "@/types/import";
import {
  FeatureSelectionPreview,
  FeatureSelectionState,
} from "@/types/feature-selection";
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";

type FeatureSelectionProps = DataTableProps & {
  onSelectionChange?: (selection: FeatureSelectionState) => void;
};

export default function FeatureSelection({
  file,
  dataset,
  isLoading = false,
  onSelectionChange,
}: FeatureSelectionProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<FeatureSelectionPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [page, setPage] = useState(1);

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Feature Selection</TypographyLarge>
      <TypographyMuted>
        Choose model input columns and optionally assign one target output
        column.
      </TypographyMuted>
    </div>
  );

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

  if (!hasDataset || !dataset) {
    return null;
  }

  const totalPages = Math.max(
    Math.ceil((preview?.rows.length ?? 0) / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const previewRows = (preview?.rows ?? []).slice(
    startIndex,
    startIndex + CLEANED_PREVIEW_ROWS,
  );
  const pageItems = getPageItems(totalPages, activePage);

  return (
    <section className="mx-auto mt-6 max-w-7xl space-y-4">
      {sectionHeader}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Column Roles</CardTitle>
          <CardDescription>
            Mark feature columns and choose one optional target column.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
                      name="target-column"
                      checked={targetIndex === index}
                      onChange={() => setTargetIndex(index)}
                    />
                    Target
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Target is optional. Features selected: {sortedFeatures.length}
          </div>
        </CardContent>
      </Card>

      {isPreviewLoading && !preview ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Preparing feature selection preview.
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
              <CardTitle className="text-base">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-semibold">Total Columns</p>
                <p className="text-muted-foreground">
                  {preview.summary.totalColumns}
                </p>
              </div>
              <div>
                <p className="font-semibold">Selected Features</p>
                <p className="text-muted-foreground">
                  {preview.summary.selectedFeatureCount}
                </p>
              </div>
              <div>
                <p className="font-semibold">Rows</p>
                <p className="text-muted-foreground">
                  {preview.summary.rowCount}
                </p>
              </div>
              <div>
                <p className="font-semibold">Target</p>
                <p className="text-muted-foreground">
                  {preview.targetHeader ?? "None"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Selected Dataset Preview
              </CardTitle>
              <CardDescription>
                Showing selected feature columns
                {preview.targetHeader ? " and target column" : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {preview.selectedHeaders.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, rowIndex) => (
                      <TableRow
                        key={`feature-preview-${startIndex + rowIndex}`}
                      >
                        {preview.selectedHeaders.map((_, colIndex) => (
                          <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                            {row[colIndex] ?? ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="flex justify-end">
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
                          key={`selection-page-${item ?? "gap"}-${index}`}
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
