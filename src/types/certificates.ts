// The fields in a certificate
export type CertificateFields =
  | "initiative"
  | "category"
  | "textField"
  | "recipientName"
  | "certificateDate";

// Certificate data including optional _invalid flags
export type CertificateData = {
  initiative: string;
  category: string;
  textField: string;
  recipientName: string;
  certificateDate?: string;
  signature?: string; // optional now
  signatory?: string;
} & {
  [K in `${CertificateFields}_invalid`]?: boolean;
};

// Data without _invalid flags
export type CleanCertificateData = Omit<CertificateData, `${CertificateFields}_invalid`>;
