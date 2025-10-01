// components/home/CSVUploader.tsx
"use client";
import Papa from "papaparse";

interface CSVUploaderProps {
  onDataParsed: (data: any[]) => void;
}

export default function CSVUploader({ onDataParsed }: CSVUploaderProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // treat first row as headers
      skipEmptyLines: true,
      complete: (results) => {
        onDataParsed(results.data as any[]);
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
