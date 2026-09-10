import {
  type Student,
  type Drive,
  type RequiredSkill,
  getPlacedApplicationsApi,
  savePlacedApplicationApi,
  updatePlacedApplicationStatusApi,
} from "../api";

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

// Online company logo mapping & automatic domain search
const COMPANY_DOMAINS: Record<string, string> = {
  google: "google.com",
  microsoft: "microsoft.com",
  amazon: "amazon.com",
  infosys: "infosys.com",
  tcs: "tcs.com",
  "tata consultancy": "tcs.com",
  wipro: "wipro.com",
  accenture: "accenture.com",
  cognizant: "cognizant.com",
  ibm: "ibm.com",
  zoho: "zoho.com",
  deloitte: "deloitte.com",
  oracle: "oracle.com",
  capgemini: "capgemini.com",
  hcl: "hcltech.com",
  paypal: "paypal.com",
  adobe: "adobe.com",
  salesforce: "salesforce.com",
  atlassian: "atlassian.com",
  intel: "intel.com",
  nvidia: "nvidia.com",
  cisco: "cisco.com",
  amd: "amd.com",
  qualcomm: "qualcomm.com",
  samsung: "samsung.com",
  apple: "apple.com",
  meta: "meta.com",
  facebook: "meta.com",
  uber: "uber.com",
  swiggy: "swiggy.com",
  zomato: "zomato.com",
  flipkart: "flipkart.com",
  phonepe: "phonepe.com",
  paytm: "paytm.com",
  goldman: "goldmansachs.com",
  morgan: "morganstanley.com",
  jpmorgan: "jpmorganchase.com",
  walmart: "walmart.com",
};

/**
 * Returns a high-res online company logo URL based on company name or website URL.
 */
export function getCompanyLogoUrl(companyName: string, companyUrl?: string): string {
  if (!companyName) return "";
  const nameLower = companyName.trim().toLowerCase();

  for (const [key, domain] of Object.entries(COMPANY_DOMAINS)) {
    if (nameLower.includes(key)) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }

  if (companyUrl) {
    try {
      const cleanUrl = companyUrl.startsWith("http") ? companyUrl : `https://${companyUrl}`;
      const domain = new URL(cleanUrl).hostname.replace(/^www\./, "");
      if (domain) {
        return `https://logo.clearbit.com/${domain}`;
      }
    } catch {
      // Fallback
    }
  }

  const slug = nameLower.replace(/[^a-z0-9]/g, "");
  return `https://logo.clearbit.com/${slug}.com`;
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

/**
 * Syncs local storage with backend database.
 * Uploads local entries to backend if missing, and downloads backend entries.
 */
export async function syncPlacedApplicationsWithServer(): Promise<PlacedApplicationRequest[]> {
  try {
    const local = getPlacedApplications();
    const remote = await getPlacedApplicationsApi();

    // Map by id and by (driveId + studentId)
    const map = new Map<string, PlacedApplicationRequest>();
    for (const r of remote) {
      const key = `${r.driveId}_${r.studentId}`;
      map.set(key, r as PlacedApplicationRequest);
    }

    // Merge any existing local ones that haven't reached server yet
    for (const l of local) {
      const key = `${l.driveId}_${l.studentId}`;
      if (!map.has(key)) {
        map.set(key, l);
        // Upload to server in background
        void savePlacedApplicationApi(l as any).catch(() => { });
      } else {
        // If remote has it, remote takes precedence unless local was updated
        const existing = map.get(key)!;
        if (l.status !== existing.status && l.status !== "PENDING") {
          map.set(key, l);
        }
      }
    }

    const merged = Array.from(map.values());
    localStorage.setItem(PLACED_APPS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event("placed_apps_synced"));
    return merged;
  } catch {
    return getPlacedApplications();
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
  if (existing) {
    // Attempt background sync if not on server
    void savePlacedApplicationApi(existing as any).catch(() => { });
    return existing;
  }

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
  window.dispatchEvent(new Event("placed_apps_synced"));

  // Persist to backend database
  void savePlacedApplicationApi(newReq as any).catch((err) => {
    console.warn("Notice: server sync queued", err);
  });

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
  window.dispatchEvent(new Event("placed_apps_synced"));

  // Persist status update to backend database
  void updatePlacedApplicationStatusApi(requestId, status).catch((err) => {
    console.warn("Notice: server status sync queued", err);
  });
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
