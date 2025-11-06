import { demoCSV } from '../../data/demoData';

export function loadCSVData(): Promise<string> {
  return Promise.resolve(demoCSV);
}

export function parseCSVData(csvContent: string, organizationName: string): any[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // 🔹 Read headers dynamically (case-insensitive)
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.split(';');

    const get = (name: string) => {
      const idx = headers.indexOf(name.toLowerCase());
      return idx >= 0 ? cols[idx]?.trim() || '' : '';
    };

    return {
      recipientName: get('recipientname'),
      programName: get('programname'),
      category: get('category'),
      achievementText: get('achievementtext'),
      email: get('email').toLowerCase(),
      type: get('type') || 'Achievement',
      organization: get('organization'), // Use organization from CSV data
    };
  });
}


export function parseCSVDataForSharing(csvContent: string, organizationName: string): any[] {
  if (!csvContent.trim()) return [];

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());

  const get = (cols: string[], name: string) => {
    const idx = headers.indexOf(name.toLowerCase());
    return idx >= 0 ? cols[idx]?.trim() || '' : '';
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(';');

    const recipient: any = {
      recipientName: get(cols, 'recipientname'),
      programName: get(cols, 'programname'),
      category: get(cols, 'category'),
      achievementText: get(cols, 'achievementtext'),
      email: get(cols, 'email').toLowerCase(),
      type: get(cols, 'type') || 'Achievement',
      organization: get(cols, 'organization'),
    };

    // Optional social/contact fields
    if (headers.includes('whatsapp')) recipient.whatsapp = get(cols, 'whatsapp');
    if (headers.includes('phone')) recipient.phone = get(cols, 'phone');
    if (headers.includes('facebook')) recipient.facebook = get(cols, 'facebook');
    if (headers.includes('linkedin')) recipient.linkedin = get(cols, 'linkedin');
    if (headers.includes('twitter')) recipient.twitter = get(cols, 'twitter');

    return recipient;
  });
}
