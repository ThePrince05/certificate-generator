import { demoCSV } from '../../data/demoData';

// Define interface for CSV data
export interface CSVRecipient {
  recipientName: string;
  programName: string;
  category: string;
  achievementText: string;
  fieldOfInterest: string;
  email: string;
  type: string;
  organization: string;
  certificateDate: string;
}

export function loadCSVData(): Promise<string> {
  return Promise.resolve(demoCSV);
}

export function parseCSVData(csvContent: string, organizationName: string): CSVRecipient[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // 🔹 Read headers dynamically (case-insensitive)
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  
  // Remove the unused 'index' parameter
  const parsedData = lines.slice(1).map((line) => {
    const cols = line.split(';');

    const get = (name: string) => {
      const idx = headers.indexOf(name.toLowerCase());
      const value = idx >= 0 ? cols[idx]?.trim() || '' : '';
      
      // Convert "Unspecified" to empty string
      if (value.toLowerCase() === 'unspecified') {
        return '';
      }
      return value;
    };

    const programName = get('programname');
    const fieldOfInterest = get('fieldofinterest');
    
    return {
      recipientName: get('recipientname'),
      programName: programName,
      category: get('category'),
      achievementText: get('achievementtext'),
      fieldOfInterest: fieldOfInterest,
      email: get('email').toLowerCase(),
      type: get('type') || 'Achievement',
      organization: get('organization') || organizationName,
      certificateDate: get('certificatedate') || '',
    };
  });

  return parsedData;
}

export function parseCSVDataForSharing(csvContent: string, organizationName: string): CSVRecipient[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

  const get = (cols: string[], name: string) => {
    const idx = headers.indexOf(name.toLowerCase());
    const value = idx >= 0 ? cols[idx]?.trim() || '' : '';
    
    // Convert "Unspecified" to empty string
    if (value.toLowerCase() === 'unspecified') {
      return '';
    }
    return value;
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(';');

    const recipient: CSVRecipient = {
      recipientName: get(cols, 'recipientname'),
      programName: get(cols, 'programname'),
      category: get(cols, 'category'),
      achievementText: get(cols, 'achievementtext'),
      fieldOfInterest: get(cols, 'fieldofinterest'),
      email: get(cols, 'email').toLowerCase(),
      type: get(cols, 'type') || 'Achievement',
      organization: get(cols, 'organization') || organizationName,
      certificateDate: get(cols, 'certificatedate') || '',
    };

    return recipient;
  });
}