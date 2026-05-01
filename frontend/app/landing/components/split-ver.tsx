"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TypographyLarge, TypographyMuted } from "@/components/typography";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTableProps } from "@/types/import";
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";
import { useDatasetSplitting } from "@/hooks/useDatasetSplitting";

const SPLIT_RATIOS = [0.2, 0.25, 0.3];

export default function SplitVer({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  // Extract all state and logic from the custom hook
  const {
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
  } = useDatasetSplitting({ file, dataset, isLoading });

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Train-Test Split</TypographyLarge>
      <TypographyMuted>
        Split your dataset into training and testing sets for model evaluation.
      </TypographyMuted>
    </div>
  );

  if (isLoading) {
    return null;
  }

  if (
    !file ||
    !dataset ||
    dataset.headers.length === 0 ||
    dataset.rows.length === 0
  ) {
    return null;
  }

  if (isSplittingLoading && !splitData) {
    return (
      <section className="mx-auto mt-6 max-w-7xl space-y-4">
        {sectionHeader}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Splitting dataset</CardTitle>
            <CardDescription>
              Processing train-test split through backend service.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (!splitData) {
    return (
      <section className="mx-auto mt-6 max-w-7xl space-y-4">
        {sectionHeader}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {splittingError || "No split data is available yet."}
          </CardContent>
        </Card>
      </section>
    );
  }

  const currentSet =
    activeTab === "train" ? splitData.trainSet : splitData.testSet;
  const totalPages = Math.max(
    Math.ceil(currentSet.rows.length / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const displayRows = currentSet.rows.slice(
    startIndex,
    startIndex + CLEANED_PREVIEW_ROWS,
  );
  const pageItems = getPageItems(totalPages, activePage);

  return (
    <section className="mx-auto mt-6 max-w-7xl space-y-4">
      {sectionHeader}

      {summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Split Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Total Rows</p>
                <p className="text-muted-foreground">{summary.totalRows}</p>
              </div>
              <div>
                <p className="font-semibold">Test Size</p>
                <p className="text-muted-foreground">
                  {(testSize * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="font-semibold">Training Rows</p>
                <p className="text-muted-foreground">
                  {summary.trainRows} ({summary.trainPercentage}%)
                </p>
              </div>
              <div>
                <p className="font-semibold">Testing Rows</p>
                <p className="text-muted-foreground">
                  {summary.testRows} ({summary.testPercentage}%)
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4">
              <p className="text-sm font-semibold">Test Size Preset</p>
              <div className="flex gap-2">
                {SPLIT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio}
                    variant={testSize === ratio ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSplitRatio(ratio)}
                  >
                    {(ratio * 100).toFixed(0)}%
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {activeTab === "train" ? "Training" : "Testing"} Set
              </CardTitle>
              <CardDescription>
                {activeTab === "train"
                  ? `${summary?.trainRows} rows for model training`
                  : `${summary?.testRows} rows for model evaluation`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "train" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab("train");
                  setPage(1);
                }}
              >
                Training
              </Button>
              <Button
                variant={activeTab === "test" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab("test");
                  setPage(1);
                }}
              >
                Testing
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {currentSet.headers.map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.length > 0 ? (
                  displayRows.map((row, rowIndex) => (
                    <TableRow key={`${activeTab}-${startIndex + rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={`${cellIndex}-${cell}`}
                          className="max-w-xs truncate"
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={currentSet.headers.length}
                      className="text-center text-muted-foreground"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />

                  {pageItems.map((item, index) => (
                    <PaginationItem key={`${item ?? "ellipsis"}-${index}`}>
                      {item === null ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={item === activePage}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
