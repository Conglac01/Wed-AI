import type { CVFile, CVPreview, CVExtractedInfo } from "./types";

// ── Mock CV File ───────────────────────────────────────────────────────────────

export const mockCVFile: CVFile = {
  name: "Nguyen_Minh_Anh_CV.pdf",
  size: 1.2 * 1024 * 1024, // 1.2 MB in bytes
  type: "application/pdf",
  extension: ".pdf",
  lastModified: Date.now(),
};

// ── Mock CV Preview ────────────────────────────────────────────────────────────

export const mockCVPreview: CVPreview = {
  fileName: "Nguyen_Minh_Anh_CV.pdf",
  fileType: "PDF",
  fileSize: "1.2 MB",
  uploadTime: "10:24 AM, 20/05/2024",
  fileUrl: "#", // mock URL
};

// ── Mock Extracted Info ────────────────────────────────────────────────────────

export const mockExtractedInfo: CVExtractedInfo = {
  fullName: "Nguyễn Minh Anh",
  title: "Frontend Developer",
  yearsOfExperience: 3,
  email: "minhanh@gmail.com",
  phone: "0987 654 321",
  education: "Đại học Bách Khoa Hà Nội",
  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Tailwind CSS",
    "Node.js",
    "Git",
    "REST API",
  ],
  additionalSkillCount: 5,
};

// ── Supported Formats ──────────────────────────────────────────────────────────

export const SUPPORTED_FORMATS = [
  { label: "PDF", extensions: [".pdf"], icon: "pdf" },
  { label: "Word", extensions: [".doc", ".docx"], icon: "word" },
  { label: "Text", extensions: [".txt"], icon: "txt" },
  { label: "Image", extensions: [".jpg", ".jpeg", ".png"], icon: "img" },
] as const;
