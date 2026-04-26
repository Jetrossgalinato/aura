"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchCleanedPreview } from "@/services/data-cleaning";
import { CleaningSummary, DataTableProps, ParsedDataset } from "@/types/import";
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";

export default function CleanedVer({
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

  if (isCleaningLoading && !cleanedDataset) {
    return (
      <section className="mx-auto mt-6 max-w-7xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cleaned data preview</CardTitle>
            <CardDescription>
              Cleaning rows through backend service.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (!cleanedDataset) {
    return (
      <section className="mx-auto mt-6 max-w-7xl">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {cleaningError || "No cleaned data is available yet."}
          </CardContent>
        </Card>
      </section>
    );
  }

  const totalPages = Math.max(
    Math.ceil(cleanedDataset.rows.length / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const previewRows = cleanedDataset.rows.slice(
    startIndex,
    startIndex + CLEANED_PREVIEW_ROWS,
  );
  const pageItems = getPageItems(totalPages, activePage);

  return (
    <section className="mx-auto mt-6 max-w-7xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cleaned data preview</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{startIndex + previewRows.length} of{" "}
            {cleanedDataset.rows.length} cleaned row(s).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-2 pt-0">
          <div className="rounded-xl border border-border bg-background p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  {cleanedDataset.headers.map((header, index) => (
                    <TableHead key={`${header}-${index}`}>
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={`cleaned-row-${rowIndex}`}>
                    {cleanedDataset.headers.map((_, colIndex) => (
                      <TableCell key={`cleaned-cell-${rowIndex}-${colIndex}`}>
                        {row[colIndex] ?? "N/A"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {summary ? (
            <p className="text-xs text-muted-foreground">
              Trimmed cells: {summary.trimmedCells} | Empty normalized:{" "}
              {summary.normalizedEmptyCells} | Empty rows removed:{" "}
              {summary.removedEmptyRows}
            </p>
          ) : null}

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
                    <PaginationItem key={`${item ?? "ellipsis"}-${index}`}>
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
    </section>
  );
}
