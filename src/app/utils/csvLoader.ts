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
      email: cols[4]?.trim().toLowerCase() || '',
      organization: organizationName,
    };
  });
}

export function parseCSVDataForSharing(csvContent: string, organizationName: string): any[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.split(';');

    const recipient: any = {
      recipientName: cols[0]?.trim() || '',
      programName: cols[1]?.trim() || '',
      category: cols[2]?.trim() || '',
      achievementText: cols[3]?.trim() || '',
     email: cols[4]?.trim().toLowerCase() || '',
      organization: organizationName,
    };

    if (headers.includes('whatsapp')) recipient.whatsapp = cols[headers.indexOf('whatsapp')]?.trim() || '';
    if (headers.includes('phone')) recipient.phone = cols[headers.indexOf('phone')]?.trim() || '';
    if (headers.includes('facebook')) recipient.facebook = cols[headers.indexOf('facebook')]?.trim() || '';
    if (headers.includes('linkedin')) recipient.linkedin = cols[headers.indexOf('linkedin')]?.trim() || '';
    if (headers.includes('twitter')) recipient.twitter = cols[headers.indexOf('twitter')]?.trim() || '';

    return recipient;
  });
}
