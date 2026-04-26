"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function cleanCellValue(value: string | undefined) {
  const normalized = (value ?? "").trim();
  return normalized === "" ? "N/A" : normalized;
}

export default function CleanedVer({
  file,
  dataset,
  isLoading = false,
}: DataTableProps) {
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

  const previewRows = dataset.rows.slice(0, CLEANED_PREVIEW_ROWS);

  return (
    <section className="mx-auto mt-3 max-w-7xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cleaned data preview</CardTitle>
          <CardDescription>
            Showing first {previewRows.length} cleaned row(s). Empty values are
            normalized to N/A.
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
        </CardContent>
      </Card>
    </section>
  );
}
