import type { Student, Drive, RequiredSkill } from "../api";

export interface EligibilityResult {
  score: number; // 0 - 100
  isEligible: boolean;
  reasons: string[]; // List of reasons why not eligible (or warning notes)
}

export interface PlacedApplicationRequest {
  id: string;
  driveId: number;
  driveTitle: string;
  companyName: string;
  studentId: number;
  studentName: string;
  studentRegNo: string;
  studentDept: string;
  studentCgpa: number;
  placedCompany: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

export interface StudentInterviewFeedback {
  studentId: number;
  studentName: string;
  companyId: number;
  companyName: string;
  feedbackUrl: string;
  notes?: string;
  updatedAt: string;
}

// Online company logo mapping & automatic search fallback
const ONLINE_COMPANY_LOGOS: Record<string, string> = {
  google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  microsoft: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  amazon: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  infosys: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
  tcs: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
  wipro: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg",
  accenture: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture_logo.svg",
  cognizant: "https://upload.wikimedia.org/wikipedia/commons/2/20/Cognizant_logo.svg",
  ibm: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
  zoho: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Zoho_logo.svg",
  deloitte: "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg",
  oracle: "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
  capgemini: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg",
  hcl: "https://upload.wikimedia.org/wikipedia/commons/8/87/HCL_Technologies_logo.svg",
  paypal: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
  adobe: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg",
  salesforce: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
};

/**
 * Returns a high-res online company logo URL based on company name or website URL.
 */
export function getCompanyLogoUrl(companyName: string, companyUrl?: string): string {
  if (!companyName) return "";
  const nameLower = companyName.trim().toLowerCase();

  for (const [key, logoUrl] of Object.entries(ONLINE_COMPANY_LOGOS)) {
    if (nameLower.includes(key)) {
      return logoUrl;
    }
  }

  if (companyUrl) {
    try {
      const cleanUrl = companyUrl.startsWith("http") ? companyUrl : `https://${companyUrl}`;
      const domain = new URL(cleanUrl).hostname.replace(/^www\./, "");
      if (domain) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    } catch {
      // Fallback
    }
  }

  const slug = nameLower.replace(/[^a-z0-9]/g, "");
  return `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`;
}

/**
 * Calculates Student Eligibility Score (0-100%) and returns detailed ineligible reasons.
 */
export function calculateEligibility(
  student: Student | null,
  drive: Drive,
  requiredSkills: RequiredSkill[] = []
): EligibilityResult {
  if (!student) {
    return {
      score: 0,
      isEligible: false,
      reasons: ["Student information not loaded."],
    };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. CGPA evaluation (Max 35 pts)
  const cgpa = Number(student.cgpa) || 0;
  const cgpaScore = Math.min(35, Math.round((cgpa / 10.0) * 35));
  score += cgpaScore;

  // 2. Active Arrears Check (Max 25 pts)
  const activeArrears = Number(student.active_arrear) || 0;
  const maxArrearAllowed = Number(drive.max_arrear) ?? 0;

  if (activeArrears > maxArrearAllowed) {
    reasons.push(
      `Active Arrears (${activeArrears}) exceeds maximum allowed for this drive (${maxArrearAllowed}).`
    );
  } else {
    score += 25;
  }

  // 3. Department Check (Max 25 pts)
  const allowedDepts = Array.isArray(drive.allowed_dept)
    ? (drive.allowed_dept as string[])
    : drive.allowed_dept && typeof drive.allowed_dept === "object"
    ? Object.values(drive.allowed_dept as Record<string, string>)
    : [];

  const studentDept = (student.department || "").trim().toLowerCase();

  let deptMatch = allowedDepts.length === 0;
  if (!deptMatch && studentDept) {
    deptMatch = allowedDepts.some(
      (dept) =>
        dept.toLowerCase() === studentDept ||
        (studentDept.includes("information technology") && dept.toLowerCase() === "it") ||
        (studentDept.includes("computer science") && dept.toLowerCase() === "cse")
    );
  }

  if (!deptMatch) {
    reasons.push(
      `Department (${student.department || "Unspecified"}) is not in eligible departments list (${allowedDepts.join(", ")}).`
    );
  } else {
    score += 25;
  }

  // 4. Batch Match
  if (drive.target_cg_batch && Number(student.batch_year) !== Number(drive.target_cg_batch)) {
    reasons.push(
      `Batch Year (${student.batch_year}) does not match target batch (${drive.target_cg_batch}).`
    );
  }

  // 5. Required Skills Match
  if (requiredSkills.length > 0) {
    score += 15;
  } else {
    score += 15;
  }

  const isEligible = reasons.length === 0;

  return {
    score: Math.min(100, score),
    isEligible,
    reasons,
  };
}

// Storage key for placed student application requests
const PLACED_APPS_KEY = "hireon.placed_applications";

export function getPlacedApplications(): PlacedApplicationRequest[] {
  try {
    const data = localStorage.getItem(PLACED_APPS_KEY);
    return data ? (JSON.parse(data) as PlacedApplicationRequest[]) : [];
  } catch {
    return [];
  }
}

export function savePlacedApplicationRequest(
  drive: Drive,
  student: Student
): PlacedApplicationRequest {
  const current = getPlacedApplications();
  const existing = current.find(
    (req) => req.driveId === drive.driveId && req.studentId === student.sId
  );
  if (existing) return existing;

  const newReq: PlacedApplicationRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    driveId: drive.driveId,
    driveTitle: `${drive.company?.c_name ?? "Company"} - ${drive.job_role}`,
    companyName: drive.company?.c_name ?? "Company",
    studentId: student.sId,
    studentName: student.name,
    studentRegNo: student.reg_no,
    studentDept: student.department,
    studentCgpa: student.cgpa,
    placedCompany: student.company?.c_name || "Placed Company",
    status: "PENDING",
    requestedAt: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  current.push(newReq);
  localStorage.setItem(PLACED_APPS_KEY, JSON.stringify(current));
  return newReq;
}

export function updatePlacedApplicationStatus(
  requestId: string,
  status: "APPROVED" | "REJECTED"
) {
  const current = getPlacedApplications();
  const updated = current.map((req) =>
    req.id === requestId ? { ...req, status } : req
  );
  localStorage.setItem(PLACED_APPS_KEY, JSON.stringify(updated));
}

// Interview Feedback Storage Functions
const INTERVIEW_FEEDBACK_KEY = "hireon.interview_feedback";

export function getAllInterviewFeedback(): StudentInterviewFeedback[] {
  try {
    const data = localStorage.getItem(INTERVIEW_FEEDBACK_KEY);
    return data ? (JSON.parse(data) as StudentInterviewFeedback[]) : [];
  } catch {
    return [];
  }
}

export function saveInterviewFeedback(
  studentId: number,
  studentName: string,
  companyId: number,
  companyName: string,
  feedbackUrl: string,
  notes?: string
) {
  const current = getAllInterviewFeedback();
  const existingIndex = current.findIndex(
    (item) => item.studentId === studentId && item.companyId === companyId
  );

  const entry: StudentInterviewFeedback = {
    studentId,
    studentName,
    companyId,
    companyName,
    feedbackUrl: feedbackUrl.trim(),
    notes: notes?.trim(),
    updatedAt: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  if (existingIndex >= 0) {
    current[existingIndex] = entry;
  } else {
    current.push(entry);
  }

  localStorage.setItem(INTERVIEW_FEEDBACK_KEY, JSON.stringify(current));
}

/**
 * Formats full email body content with student info and skill proficiency breakdown.
 */
export function generateStudentEmailContent(
  student: Student,
  skills: { name: string; proficiency: number }[] = []
): { subject: string; body: string } {
  const subject = `Placement Candidate Profile: ${student.name} (${student.reg_no}) - ${student.department}`;
  
  const skillLines =
    skills.length > 0
      ? skills.map((s) => `- ${s.name}: ${s.proficiency}/5 Stars (${s.proficiency * 20}% Proficiency)`).join("\n")
      : "No verified skills recorded yet.";

  const body = `Dear Placement Director / Hiring Manager,

Here is the student placement profile and skill proficiency report for ${student.name}:

--- CANDIDATE DETAILS ---
Name: ${student.name}
Registration No: ${student.reg_no}
Department: ${student.department}
Batch Year: ${student.batch_year}
CGPA: ${student.cgpa} / 10.0
Active Arrears: ${student.active_arrear}
History of Arrears: ${student.history_of_arrear}
Placement Status: ${student.placement_status} ${student.company ? `(Placed at ${student.company.c_name})` : ""}
Resume URL: ${student.resume_url}

--- SKILL PROFICIENCY BREAKDOWN ---
${skillLines}

Sent via HireOn Placement Management Portal.
`;

  return { subject, body };
}
