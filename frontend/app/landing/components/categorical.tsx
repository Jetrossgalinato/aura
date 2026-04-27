"use client";

import { useEffect, useState } from "react";

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
import { CLEANED_PREVIEW_ROWS, getPageItems } from "@/lib/table-pagination";
import { fetchCategoricalPreview } from "@/services/categorical";
import { EncodedDataset } from "@/types/categorical";
import { DataTableProps } from "@/types/import";

export default function Categorical({
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

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Categorical Encoding Preview</TypographyLarge>
      <TypographyMuted>
        See how text based values are mapped into numeric codes for modeling.
      </TypographyMuted>
    </div>
  );

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

  if (isEncodingLoading && !encodedDataset) {
    return (
      <section className="mx-auto mt-6 max-w-7xl space-y-4">
        {sectionHeader}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Encoded data preview</CardTitle>
            <CardDescription>
              Encoding categorical values through the backend service.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (!encodedDataset) {
    return (
      <section className="mx-auto mt-6 max-w-7xl space-y-4">
        {sectionHeader}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {encodingError || "No encoded data is available yet."}
          </CardContent>
        </Card>
      </section>
    );
  }

  const totalPages = Math.max(
    Math.ceil(encodedDataset.rows.length / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const previewRows = encodedDataset.rows.slice(
    startIndex,
    startIndex + CLEANED_PREVIEW_ROWS,
  );
  const pageItems = getPageItems(totalPages, activePage);

  return (
    <section className="mx-auto mt-8 max-w-7xl space-y-4">
      {sectionHeader}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Encoded data preview</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{startIndex + previewRows.length} of{" "}
            {encodedDataset.rows.length} row(s).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 p-2 pt-0">
          <div className="rounded-xl border border-border bg-background p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  {encodedDataset.headers.map((header, index) => (
                    <TableHead key={`${header}-${index}`}>
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={`encoded-row-${rowIndex}`}>
                    {encodedDataset.headers.map((_, colIndex) => (
                      <TableCell key={`encoded-cell-${rowIndex}-${colIndex}`}>
                        {row[colIndex] ?? "N/A"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            Encoded columns: {encodedDataset.encodedColumns.length} of{" "}
            {encodedDataset.headers.length}
          </p>

          {encodedDataset.encodedColumns.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {encodedDataset.encodedColumns.map((column) => (
                <p
                  key={`${column.header}-${column.columnIndex}`}
                  className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="font-medium text-foreground">
                    {column.header}:
                  </span>{" "}
                  {Object.entries(column.mapping)
                    .map(([value, code]) => `\"${value}\"=${code}`)
                    .join(", ")}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No categorical columns were detected. Numeric columns stay
              unchanged.
            </p>
          )}

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
