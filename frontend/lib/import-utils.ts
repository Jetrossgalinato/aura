import { DatasetInfo, ParsedDataset } from "@/types/import";

export const ACCEPTED_EXTENSIONS = ["csv", "xls", "xlsx"];

export function isAcceptedFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && ACCEPTED_EXTENSIONS.includes(ext);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export async function buildDatasetInfo(file: File): Promise<DatasetInfo> {
  const format = file.name.split(".").pop()?.toUpperCase() ?? "Unknown";

  const baseInfo: DatasetInfo = {
    format,
    mimeType: file.type || "Unknown",
    lastModified: new Date(file.lastModified).toLocaleString(),
    rowCount: null,
    columnCount: null,
  };

  if (format !== "CSV") {
    return baseInfo;
  }

  try {
    const text = await file.text();
    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return { ...baseInfo, rowCount: 0, columnCount: 0 };
    }

    const headerColumns = parseCsvLine(lines[0]).length;
    const sampleDataColumns = lines[1] ? parseCsvLine(lines[1]).length : 0;

    return {
      ...baseInfo,
      rowCount: Math.max(lines.length - 1, 0),
      columnCount: Math.max(headerColumns, sampleDataColumns),
    };
  } catch {
    return baseInfo;
  }
}

export async function parseDatasetForTable(
  file: File,
): Promise<ParsedDataset | null> {
  const format = file.name.split(".").pop()?.toUpperCase() ?? "Unknown";

  if (format !== "CSV") {
    return null;
  }

  try {
    const text = await file.text();
    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return { format, headers: [], rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    return {
      format,
      headers,
      rows,
    };
  } catch {
    return null;
  }
}
