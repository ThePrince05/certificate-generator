import { demoCSV } from '../../data/demoData';

export function loadCSVData(): Promise<string> {
  return Promise.resolve(demoCSV);
}

export function parseCSVData(csvContent: string, organizationName: string): any[] {
  if (!csvContent.trim()) return [];
  
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(';');
  
  return lines.slice(1).map((line) => {
    const cols = line.split(';');
    return {
      recipientName: cols[0]?.trim() || '',
      programName: cols[1]?.trim() || '',
      category: cols[2]?.trim() || '',
      achievementText: cols[3]?.trim() || '',
      organization: organizationName,
    };
  });
}