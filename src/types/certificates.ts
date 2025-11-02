// The fields in a certificate
export type CertificateFields =
  | "organization"
  | "category"
  | "fieldOfInterest"
  | "programName"
  | "achievementText"
  | "recipientName"
  | "certificateDate"  
  | "type";
// Certificate data including optional _invalid flags
export type CertificateData = {
  organization: string;
  category: string;
  email: string;
  fieldOfInterest: string;
  programName: string;
  achievementText: string;
  recipientName: string;
  certificateDate?: string;
  signature?: string;
  signatory?: string;
  type?: string;
} & {
  [K in `${CertificateFields}_invalid`]?: boolean;
};

// Data without _invalid flags
export type CleanCertificateData = Omit<CertificateData, `${CertificateFields}_invalid`>;

// Social media types for certificate forwarding
export interface ContactInfo {
  recipientName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  preferredMethod?: 'whatsapp' | 'email' | 'facebook' | 'linkedin' | 'twitter';
}

export interface ShareableCertificate extends CleanCertificateData {
  contactInfo?: ContactInfo;
  downloadUrl?: string;
  shareMessage?: string;
  type?: string; 
}