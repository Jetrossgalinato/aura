import { DatasetInfo, ParsedDataset } from "@/types/import";

export const ACCEPTED_EXTENSIONS = ["csv", "xls", "xlsx"];

const ACCEPTED_MIME_TYPES: Record<
  (typeof ACCEPTED_EXTENSIONS)[number],
  string[]
> = {
  csv: ["text/csv", "application/csv", "text/plain"],
  xls: ["application/vnd.ms-excel", "application/octet-stream"],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/octet-stream",
  ],
};

const MAGIC_BYTES = {
  xls: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  xlsx: [0x50, 0x4b, 0x03, 0x04],
} as const;

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase();
}

async function readFileHead(file: File, byteCount = 16) {
  const head = await file.slice(0, byteCount).arrayBuffer();
  return new Uint8Array(head);
}

function hasMagicBytes(header: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => header[index] === byte);
}

function looksTextLike(header: Uint8Array) {
  if (header.length === 0) {
    return false;
  }

  let printableCount = 0;

  for (const byte of header) {
    if (byte === 0x00) {
      return false;
    }

    if (
      byte === 0x09 ||
      byte === 0x0a ||
      byte === 0x0d ||
      (byte >= 0x20 && byte <= 0x7e)
    ) {
      printableCount += 1;
    }
  }

  return printableCount / header.length >= 0.85;
}

function looksCsvLike(header: Uint8Array) {
  if (!looksTextLike(header)) {
    return false;
  }

  const text = new TextDecoder("utf-8").decode(header);
  return /[\r\n,;\t]/.test(text) || text.trim().length > 0;
}

export async function isAcceptedFile(file: File) {
  const ext = getFileExtension(file);

  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
    return false;
  }

  const mime = file.type.toLowerCase();
  const header = await readFileHead(file);
  const mimeMatches = ACCEPTED_MIME_TYPES[ext].includes(mime);

  if (ext === "csv") {
    return mimeMatches || looksCsvLike(header);
  }

  if (ext === "xls") {
    return hasMagicBytes(header, MAGIC_BYTES.xls);
  }

  if (ext === "xlsx") {
    return hasMagicBytes(header, MAGIC_BYTES.xlsx);
  }

  return mimeMatches;
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
