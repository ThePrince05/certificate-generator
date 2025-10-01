"use client";
import Papa from "papaparse";

type CSVValue = string | number | boolean;
type CSVRow = Record<string, CSVValue>;

interface CSVUploaderProps {
  onDataParsed: (data: CSVRow[]) => void;
}

// Helper to convert CSV string values to proper types
const parseValue = (value: string): CSVValue => {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (!isNaN(Number(trimmed)) && trimmed !== "") return Number(trimmed);
  return trimmed;
};

export default function CSVUploader({ onDataParsed }: CSVUploaderProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = (results.data as Record<string, string>[]).map((row) => {
          const newRow: CSVRow = {};
          for (const key in row) {
            newRow[key] = parseValue(row[key]);
          }
          return newRow;
        });
        onDataParsed(parsedData);
      },
    });
  };

  return (
    <div className="my-6">
      <label className="block mb-2 font-semibold">Upload CSV</label>
      <input type="file" accept=".csv" onChange={handleFile} />
    </div>
  );
}
