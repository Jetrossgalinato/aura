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

const CLEANED_PREVIEW_ROWS = 8;

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

function cleanCellValue(value: string | undefined) {
  const normalized = (value ?? "").trim();
  return normalized === "" ? "N/A" : normalized;
}

export default function CleanedVer({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(
    Math.ceil(dataset.rows.length / CLEANED_PREVIEW_ROWS),
    1,
  );
  const activePage = Math.min(page, totalPages);
  const startIndex = (activePage - 1) * CLEANED_PREVIEW_ROWS;
  const previewRows = dataset.rows.slice(
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
            {dataset.rows.length} cleaned row(s). Empty values are normalized to
            N/A.
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
                  <TableRow key={`cleaned-row-${rowIndex}`}>
                    {dataset.headers.map((_, colIndex) => (
                      <TableCell key={`cleaned-cell-${rowIndex}-${colIndex}`}>
                        {cleanCellValue(row[colIndex])}
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
