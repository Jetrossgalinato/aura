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

function parseCsvText(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  let fieldQuoted = false;
  let quoteClosed = false;
  let rowHasDelimiter = false;
  let rowHasQuotedField = false;

  const pushField = () => {
    row.push(fieldQuoted ? current : current.trim());
    current = "";
    fieldQuoted = false;
    quoteClosed = false;
  };

  const pushRow = () => {
    if (
      row.length === 1 &&
      row[0] === "" &&
      !rowHasDelimiter &&
      !rowHasQuotedField
    ) {
      row = [];
      return;
    }

    rows.push(row);
    row = [];
    rowHasDelimiter = false;
    rowHasQuotedField = false;
  };

  for (let i = 0; i <= text.length; i += 1) {
    const char = i === text.length ? "\n" : text[i];

    if (char === "\r") {
      continue;
    }

    if (char === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        if (!inQuotes && current.trim().length === 0) {
          current = "";
          fieldQuoted = true;
          rowHasQuotedField = true;
        }

        inQuotes = !inQuotes;
        quoteClosed = !inQuotes;
      }
      continue;
    }

    if (quoteClosed) {
      if (char === " " || char === "\t") {
        continue;
      }

      if (char === ",") {
        pushField();
        rowHasDelimiter = true;
        continue;
      }

      if (char === "\n") {
        pushField();
        pushRow();
        continue;
      }

      current += char;
      quoteClosed = false;
      continue;
    }

    if (char === "," && !inQuotes) {
      pushField();
      rowHasDelimiter = true;
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      pushField();
      pushRow();
      continue;
    }

    current += char;
  }

  return rows;
}

function getCsvSummary(file: File) {
  return file.text().then((text) => parseCsvText(text));
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
    const rows = await getCsvSummary(file);

    if (rows.length === 0) {
      return { ...baseInfo, rowCount: 0, columnCount: 0 };
    }

    const columnCount = rows.reduce(
      (maxColumns, currentRow) => Math.max(maxColumns, currentRow.length),
      0,
    );

    return {
      ...baseInfo,
      rowCount: Math.max(rows.length - 1, 0),
      columnCount,
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
    const rows = await getCsvSummary(file);

    if (rows.length === 0) {
      return { format, headers: [], rows: [] };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return {
      format,
      headers,
      rows: dataRows,
    };
  } catch {
    return null;
  }
}
