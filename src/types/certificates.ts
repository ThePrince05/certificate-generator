// The fields in a certificate
export type CertificateFields =
  | "organization"
  | "programName"
  | "achievementText"
  | "recipientName"
  | "certificateDate";

// Certificate data including optional _invalid flags
export type CertificateData = {
  organization: string;
  programName: string;
  achievementText: string;
  recipientName: string;
  certificateDate?: string;
  signature?: string; // optional now
  signatory?: string;
} & {
  [K in `${CertificateFields}_invalid`]?: boolean;
};

// Data without _invalid flags
export type CleanCertificateData = Omit<CertificateData, `${CertificateFields}_invalid`>;
