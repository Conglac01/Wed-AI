/** Represents an uploaded CV file before processing. */
export interface CVFile {
  name: string;
  size: number; // bytes
  type: string; // MIME type
  extension: string; // e.g. ".pdf", ".docx"
  lastModified: number; // timestamp
}

/** Lightweight preview of a CV after upload + pre-parsing. */
export interface CVPreview {
  fileName: string;
  fileType: string; // display label: "PDF", "DOCX", "TXT"
  fileSize: string; // formatted: "1.2 MB"
  uploadTime: string; // formatted: "10:24 AM, 20/05/2024"
  fileUrl: string; // object URL or storage path (mock for now)
}

/** Extracted information from a CV after basic parsing. */
export interface CVExtractedInfo {
  fullName: string;
  title: string; // job title, e.g. "Frontend Developer"
  yearsOfExperience: number;
  email: string;
  phone: string;
  education: string; // primary education
  skills: string[];
  additionalSkillCount: number; // "+N kỹ năng khác"
}

/** All possible upload statuses for the CV analysis page state machine. */
export type UploadStatus =
  | "empty"
  | "uploading"
  | "success"
  | "invalid"
  | "parse_failed";
