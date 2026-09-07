const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export interface Student {
  sId: number;
  name: string;
  email: string;
  password?: string;
  reg_no: string;
  department: string;
  batch_year: number;
  role: string;
  cgpa: number;
  is_alumni: boolean;
  active_arrear: number;
  history_of_arrear: number;
  resume_url: string;
  Linkedin_url: string;
  placement_status: string;
  company?: Company | null;
}

export interface Director {
  director_id: number;
  name: string;
  email: string;
  password?: string;
}

export interface Company {
  comp_id: number;
  c_name: string;
  comp_url?: string;
}

export interface Drive {
  driveId: number;
  company: Company;
  job_role: string;
  ctc_lpa: number;
  max_arrear: number;
  target_cg_batch: number;
  description: string;
  deadline: string;
  allowed_dept: unknown;
  director?: Director;
}

export interface Registration {
  drId: number;
  drive: Drive;
  student: Student;
}

export interface StudentSkill {
  stuskill_id: number;
  skill: { skillId: number; skillName: string };
  proficiency: number;
}

export interface DriveRound {
  roundId: number;
  drive: Drive;
  roundName: string;
  roundLink?: string;
  isFinal?: boolean;
  description?: string;
  startTime?: string;
  endTime?: string;
}

export interface ShortlistedStudent {
  shortlistId: number;
  round: DriveRound;
  student: Student;
  status: string;
  feedbackUrl?: string;
}

export interface RequiredSkill {
  req_id: number;
  drive: Drive;
  skill: { skillId: number; skillName: string };
  reqProficiency: number;
}

export interface Session {
  role: "student" | "director";
  user: Student | Director;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// Students API
export const getStudents = () => request<Student[]>("/Student");
export const getStudent = (id: number) => request<Student>(`/Student/Id/${id}`);
export const getStudentByName = (name: string) => request<Student>(`/Student/Name/${encodeURIComponent(name)}`);
export const addStudent = (student: Partial<Student>) => request<Student>("/Student/Add", {
  method: "POST",
  body: JSON.stringify(student),
});
export const updateStudent = (student: Student) => request<Student>("/Student/Update", {
  method: "PUT",
  body: JSON.stringify(student),
});
export const updateStudentStatus = (id: number, status: string, compId?: number) => request<Student>(
  `/Student/Status?id=${id}&status=${encodeURIComponent(status)}${compId ? `&comp_id=${compId}` : ""}`,
  { method: "PUT" }
);
export const deleteStudent = (id: number) => request<string>(`/Student/Delete/${id}`, { method: "DELETE" });

// Directors API
export const getDirector = (id: number) => request<Director>(`/director/${id}`);
export const registerDirector = (director: Partial<Director>) => request<Director>("/director/register", {
  method: "POST",
  body: JSON.stringify(director),
});
export const updateDirector = (id: number, director: Director) => request<Director>(`/director/${id}`, {
  method: "PUT",
  body: JSON.stringify(director),
});

// Companies API
export const getCompanies = () => request<Company[]>("/Company");
export const getCompany = (id: number) => request<Company>(`/Company/Id/${id}`);
export const addCompany = (company: Partial<Company>) => request<Company>("/Company/Add", {
  method: "POST",
  body: JSON.stringify(company),
});
export const updateCompany = (company: Company) => request<Company>("/Company/Update", {
  method: "PUT",
  body: JSON.stringify(company),
});

// Drives API
export const getAllDrives = () => request<Drive[]>("/Drive");
export const getActiveDrives = () => request<Drive[]>("/Drive/ActiveDrives");
export const getDrive = (id: number) => request<Drive>(`/Drive/Id/${id}`);
export const createDrive = (drive: Partial<Drive> & { company: Partial<Company>; director?: Partial<Director> }) => request<Drive>("/Drive/Add", {
  method: "POST",
  body: JSON.stringify(drive),
});
export const updateDrive = (id: number, drive: Partial<Drive> & { company: Partial<Company>; director?: Partial<Director> }) => request<Drive>(`/Drive/Update/${id}`, {
  method: "PUT",
  body: JSON.stringify(drive),
});

// Registrations API
export const registerForDrive = (driveId: number, studentId: number) => request<Registration>(
  `/drives/${driveId}/register?studentId=${studentId}`,
  { method: "POST" }
);
export const getDriveRegistrations = (driveId: number) => request<Registration[]>(`/drives/${driveId}/registrations`);
export const getStudentRegistrations = (studentId: number) => request<Registration[]>(`/students/${studentId}/registrations`);
export const deleteRegistration = (driveId: number, studentId: number) => request<string>(
  `/drives/${driveId}/registrations/${studentId}`,
  { method: "DELETE" }
);

// Skills API
export const getSkills = () => request<{ skillId: number; skillName: string }[]>("/skills/getskills");
export const getSkillById = (id: number) => request<{ skillId: number; skillName: string }>(`/skills/${id}`);
export const createSkill = (skillName: string) => request<{ skillId: number; skillName: string }>("/skills/createskills", {
  method: "POST",
  body: JSON.stringify({ skillName }),
});
export const updateSkill = (id: number, skillName: string) => request<{ skillId: number; skillName: string }>(`/skills/${id}`, {
  method: "PUT",
  body: JSON.stringify({ skillName }),
});
export const deleteSkill = (id: number) => request<string>(`/skills/${id}`, { method: "DELETE" });

// Student Skills API
export const getStudentSkills = (studentId: number) => request<StudentSkill[]>(`/studentskill/${studentId}/skills`);
export const addStudentSkill = (studentId: number, skillId: number, proficiency: number) => request<StudentSkill>(`/studentskill/${studentId}/skills`, {
  method: "POST",
  body: JSON.stringify({ skill: { skillId }, proficiency }),
});
export const updateStudentSkill = (studentId: number, skillId: number, proficiency: number) => request<StudentSkill>(`/studentskill/${studentId}/skills/${skillId}`, {
  method: "PUT",
  body: JSON.stringify({ proficiency }),
});
export const deleteStudentSkill = (studentId: number, skillId: number) => request<string>(`/studentskill/${studentId}/skills/${skillId}`, {
  method: "DELETE",
});
export const getStudentsBySkill = (skillId: number) => request<Student[]>(`/studentskill/skills/${skillId}/students`);

// Drive Rounds API
export const getDriveRounds = (driveId: number) => request<DriveRound[]>(`/drives/${driveId}/rounds`);
export const getDriveRound = (roundId: number) => request<DriveRound>(`/rounds/${roundId}`);
export const createDriveRound = (driveId: number, roundData: { roundName: string; roundLink?: string; isFinal?: boolean; description?: string; startTime?: string; endTime?: string }) => request<DriveRound>(`/drives/${driveId}/rounds`, {
  method: "POST",
  body: JSON.stringify(roundData),
});
export const updateDriveRound = (roundId: number, roundData: { roundName: string; roundLink?: string; isFinal?: boolean; description?: string; startTime?: string; endTime?: string }) => request<DriveRound>(`/rounds/${roundId}`, {
  method: "PUT",
  body: JSON.stringify(roundData),
});
export const deleteDriveRound = (roundId: number) => request<string>(`/rounds/${roundId}`, { method: "DELETE" });

// Shortlisted Students API
export const shortlistStudent = (roundId: number, studentId: number) => request<ShortlistedStudent>(
  `/rounds/${roundId}/shortlist?studentId=${studentId}`,
  { method: "POST" }
);
export const getShortlistedByRound = (roundId: number) => request<ShortlistedStudent[]>(`/rounds/${roundId}/shortlisted`);
export const getShortlistedByStudent = (studentId: number) => request<ShortlistedStudent[]>(`/students/${studentId}/shortlisted`);
export const updateShortlistStatus = (shortlistId: number, status: string) => request<ShortlistedStudent>(
  `/shortlisted/${shortlistId}/status?status=${encodeURIComponent(status)}`,
  { method: "PATCH" }
);
export const addShortlistFeedback = (shortlistId: number, feedbackUrl: string) => request<ShortlistedStudent>(
  `/shortlisted/${shortlistId}/feedback?feedbackUrl=${encodeURIComponent(feedbackUrl)}`,
  { method: "POST" }
);
export const getShortlistFeedback = (shortlistId: number) => request<string>(`/shortlisted/${shortlistId}/feedback`);
export const deleteShortlist = (shortlistId: number) => request<string>(`/shortlisted/${shortlistId}`, { method: "DELETE" });

// Required Skills API
export const getRequiredSkills = (driveId: number) => request<RequiredSkill[]>(`/drives/${driveId}/required-skills`);
export const addRequiredSkill = (driveId: number, reqData: { skillId: number; reqProficiency: number }) => request<RequiredSkill>(`/drives/${driveId}/required-skills`, {
  method: "POST",
  body: JSON.stringify(reqData),
});
export const updateRequiredSkill = (driveId: number, skillId: number, reqData: { reqProficiency: number }) => request<RequiredSkill>(`/drives/${driveId}/required-skills/${skillId}`, {
  method: "PUT",
  body: JSON.stringify(reqData),
});
export const deleteRequiredSkill = (driveId: number, skillId: number, reqData?: { reqProficiency?: number }) => request<void>(`/drives/${driveId}/required-skills/${skillId}`, {
  method: "DELETE",
  body: JSON.stringify(reqData ?? {}),
});

// Sessions
export function getSession(): Session | null {
  const value = localStorage.getItem("hireon.session");
  return value ? (JSON.parse(value) as Session) : null;
}

export function saveSession(session: Session) {
  localStorage.setItem("hireon.session", JSON.stringify(session));
  localStorage.setItem("hireon.role", session.role);
}

export function clearSession() {
  localStorage.removeItem("hireon.session");
  localStorage.removeItem("hireon.role");
}

export function departmentsFromDrive(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (value && typeof value === "object") {
    return Object.values(value).filter((item): item is string => typeof item === "string");
  }

  return [];
}