// src/types/certificates.ts

// The fields in a certificate
export type CertificateFields =
  | "heading"
  | "subheading"
  | "name"
  | "certificateDate"
  | "signature"
  | "signatory";

// Certificate data including optional _invalid flags
export type CertificateData = {
  heading: string;
  subheading: string;
  name: string;
  certificateDate: string;
  signature: string;
  signatory: string;
} & {
  [K in `${CertificateFields}_invalid`]?: boolean;
};

// Data without _invalid flags
export type CleanCertificateData = Omit<CertificateData, `${CertificateFields}_invalid`>;
