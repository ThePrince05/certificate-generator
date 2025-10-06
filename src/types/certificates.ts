// The fields in a certificate
export type CertificateFields =
  | "heading"
  | "subheading"
  | "pakText"
  | "name"
  | "certificateDate";

// Certificate data including optional _invalid flags
export type CertificateData = {
  heading: string;
  subheading: string;
  pakText: string;
  name: string;
  certificateDate?: string;
  signature?: string; // optional now
  signatory?: string;
} & {
  [K in `${CertificateFields}_invalid`]?: boolean;
};

// Data without _invalid flags
export type CleanCertificateData = Omit<CertificateData, `${CertificateFields}_invalid`>;
