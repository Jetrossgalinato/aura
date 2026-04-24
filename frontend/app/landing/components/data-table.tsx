import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableProps } from "@/types/import";

const PREVIEW_ROW_LIMIT = 12;

export default function DataTable({ file, dataset }: DataTableProps) {
  if (!file) {
    return (
      <section className="mx-auto mt-6 max-w-4xl rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No dataset uploaded yet. Upload a CSV, XLS, or XLSX file to see the
        table preview.
      </section>
    );
  }

  if (!dataset) {
    return (
      <section className="mx-auto mt-6 max-w-4xl rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Table preview is currently available for CSV files.
      </section>
    );
  }

  if (dataset.headers.length === 0) {
    return (
      <section className="mx-auto mt-6 max-w-4xl rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Uploaded CSV is empty.
      </section>
    );
  }

  const previewRows = dataset.rows.slice(0, PREVIEW_ROW_LIMIT);

  return (
    <section className="mx-auto mt-6 max-w-7xl space-y-3">
      <p className="text-sm text-muted-foreground">
        Showing {previewRows.length} of {dataset.rows.length} row(s)
      </p>

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
    </section>
  );
}
