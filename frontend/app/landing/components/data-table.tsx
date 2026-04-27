"use client";

import { useState } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableProps } from "@/types/import";
import { PAGE_SIZE, getPageItems } from "@/lib/table-pagination";

export default function DataTable({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [page, setPage] = useState(1);

  const sectionHeader = (
    <div className="space-y-1 pb-2">
      <TypographyLarge>Dataset Preview</TypographyLarge>
      <TypographyMuted>
        Review the uploaded dataset before preprocessing or model training.
      </TypographyMuted>
    </div>
  );

  if (isLoading) {
    return (
      <section className="mx-auto mt-6 max-w-7xl space-y-4">
        {sectionHeader}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Skeleton className="h-5 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-56" />
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="rounded-xl border border-border bg-background p-2">
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton
                      key={`header-skeleton-${index}`}
                      className="h-9 w-full"
                    />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <div
                    key={`row-skeleton-${rowIndex}`}
                    className="grid grid-cols-4 gap-2"
                  >
                    {Array.from({ length: 4 }).map((__, colIndex) => (
                      <Skeleton
                        key={`cell-skeleton-${rowIndex}-${colIndex}`}
                        className="h-9 w-full"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Skeleton className="h-10 w-72 rounded-full" />
        </div>
      </section>
    );
  }

  if (!file) {
    return (
      <section className="mx-auto mt-6 max-w-4xl space-y-4">
        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No dataset uploaded yet. Upload a CSV, XLS, or XLSX file to see the
            table preview.
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!dataset) {
    return (
      <section className="mx-auto mt-6 max-w-4xl space-y-4">
        {sectionHeader}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Table preview is currently available for CSV files.
          </CardContent>
        </Card>
      </section>
    );
  }

  if (dataset.headers.length === 0) {
    return (
      <section className="mx-auto mt-6 max-w-4xl space-y-4">
        {sectionHeader}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Uploaded CSV is empty.
          </CardContent>
        </Card>
      </section>
    );
  }

  if (dataset.rows.length === 0) {
    return (
      <section className="mx-auto mt-6 max-w-4xl space-y-4">
        {sectionHeader}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            No data rows.
          </CardContent>
        </Card>
      </section>
    );
  }

  const totalPages = Math.max(Math.ceil(dataset.rows.length / PAGE_SIZE), 1);
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * PAGE_SIZE;
  const previewRows = dataset.rows.slice(startIndex, startIndex + PAGE_SIZE);
  const pageItems = getPageItems(totalPages, activePage);
  return (
    <section className="mx-auto mt-8 max-w-7xl space-y-4">
      {sectionHeader}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dataset preview</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{startIndex + previewRows.length} of{" "}
            {dataset.rows.length} row(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-2 pt-0">
          <div className="rounded-xl border border-border bg-background p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  {dataset.headers.map((header, index) => (
                    <TableHead key={`${header}-${index}`}>
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {previewRows.map((row, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {dataset.headers.map((_, colIndex) => (
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
