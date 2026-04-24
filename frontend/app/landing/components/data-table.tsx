"use client";

import { useState } from "react";

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
import { DataTableProps } from "@/types/import";

const PAGE_SIZE = 12;

function getPageItems(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, null, totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      null,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    null,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    null,
    totalPages,
  ];
}

export default function DataTable({ file, dataset }: DataTableProps) {
  const [page, setPage] = useState(1);

  if (!file) {
    return (
      <section className="mx-auto mt-6 max-w-4xl">
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
      <section className="mx-auto mt-6 max-w-4xl">
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
      <section className="mx-auto mt-6 max-w-4xl">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Uploaded CSV is empty.
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
    <section className="mx-auto mt-6 max-w-7xl space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dataset preview</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{startIndex + previewRows.length} of{" "}
            {dataset.rows.length} row(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 pt-0">
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
        </CardContent>
      </Card>

      {totalPages > 1 ? (
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
                    href="#"
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
      ) : null}
    </section>
  );
}
