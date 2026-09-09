import { useEffect, useState } from "react";
import {
  addShortlistFeedback,
  getCompanies,
  getSession,
  getShortlistedByStudent,
  getStudents,
  type Company,
  type ShortlistedStudent,
  type Student,
} from "../../api";
import {
  getAllInterviewFeedback,
  getCompanyLogoUrl,
  saveInterviewFeedback,
  type StudentInterviewFeedback,
} from "../../utils/eligibility";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentCompanies.css";

function StudentCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistedStudent[]>([]);
  const [feedbacks, setFeedbacks] = useState<StudentInterviewFeedback[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [currentStudent] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  // Modal state for adding/editing feedback
  const [selectedStudentForFeedback, setSelectedStudentForFeedback] = useState<{
    student: Student;
    company: Company;
  } | null>(null);
  const [feedbackUrlInput, setFeedbackUrlInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [companiesData, studentsData] = await Promise.all([
          getCompanies().catch(() => []),
          getStudents().catch(() => []),
        ]);
        setCompanies(companiesData);
        setStudents(studentsData);
        setFeedbacks(getAllInterviewFeedback());

        // Fetch shortlisted_student database records for all loaded students
        const shortlistedPromises = studentsData.map((st) =>
          getShortlistedByStudent(st.sId).catch(() => [])
        );
        const allShortlistsNested = await Promise.all(shortlistedPromises);
        setShortlists(allShortlistsNested.flat());
      } catch {
        setError("Unable to load visiting companies from database.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleOpenFeedbackModal = (student: Student, company: Company) => {
    setSelectedStudentForFeedback({ student, company });

    // Check shortlisted_student table feedbackUrl first
    const studentShortlists = shortlists.filter((sl) => sl.student?.sId === student.sId);
    const shortlistMatch = studentShortlists.find(
      (sl) =>
        sl.feedbackUrl &&
        (sl.round?.drive?.company?.comp_id === company.comp_id ||
          sl.round?.drive?.company?.c_name?.toLowerCase() === company.c_name.toLowerCase())
    );

    const existingLocal = feedbacks.find(
      (f) => f.studentId === student.sId && f.companyId === company.comp_id
    );

    setFeedbackUrlInput(shortlistMatch?.feedbackUrl || existingLocal?.feedbackUrl || "");
    setNotesInput(existingLocal?.notes || "");
  };

  const handleSaveFeedback = async () => {
    if (!selectedStudentForFeedback || !feedbackUrlInput.trim()) return;

    const { student, company } = selectedStudentForFeedback;
    const url = feedbackUrlInput.trim();

    // 1. Save local fallback
    saveInterviewFeedback(
      student.sId,
      student.name,
      company.comp_id,
      company.c_name,
      url,
      notesInput.trim()
    );

    // 2. Save directly to shortlisted_student table on backend API if shortlist record exists
    const studentShortlists = shortlists.filter((sl) => sl.student?.sId === student.sId);
    const shortlistRec = studentShortlists.find(
      (sl) =>
        sl.round?.drive?.company?.comp_id === company.comp_id ||
        sl.round?.drive?.company?.c_name?.toLowerCase() === company.c_name.toLowerCase()
    );

    if (shortlistRec) {
      try {
        const updated = await addShortlistFeedback(shortlistRec.shortlistId, url);
        setShortlists((prev) =>
          prev.map((item) => (item.shortlistId === updated.shortlistId ? updated : item))
        );
      } catch {
        // Fallback already saved locally
      }
    }

    setFeedbacks(getAllInterviewFeedback());
    setSuccessMsg(`Saved interview feedback link for ${student.name}!`);
    setSelectedStudentForFeedback(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <StudentPageLayout activePage="companies" title="Companies Visited">
      <div className="student-companies-page">

        {successMsg && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>✓ {successMsg}</div>}
        {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        {isLoading ? (
          <p>Loading companies from database...</p>
        ) : (
          <div className="companies-list" style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "1.5rem" }}>
            {companies.length === 0 ? (
              <div className="empty-companies">
                <p>No companies found in database.</p>
              </div>
            ) : (
              companies.map((company) => {
                const logoUrl = getCompanyLogoUrl(company.c_name, company.comp_url);

                // Find all students placed in this company
                const placedStudents = students.filter((st) => {
                  if (st.placement_status !== "Placed") return false;
                  if (st.company?.comp_id && st.company.comp_id === company.comp_id) return true;
                  if (st.company?.c_name && st.company.c_name.toLowerCase() === company.c_name.toLowerCase()) return true;
                  return false;
                });

                return (
                  <div
                    key={company.comp_id}
                    className="company-card-full"
                    style={{
                      padding: "24px",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      background: "#ffffff",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Company Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <img
                          src={logoUrl}
                          alt={company.c_name}
                          className="company-logo-img"
                          style={{ width: "56px", height: "56px" }}
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/56?text=CO";
                          }}
                        />
                        <div>
                          <h2 style={{ margin: 0, color: "#0F172A", fontSize: "1.35rem", fontWeight: "800" }}>
                            {company.c_name}
                          </h2>
                          {company.comp_url ? (
                            <a
                              href={company.comp_url.startsWith("http") ? company.comp_url : `https://${company.comp_url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.85rem", color: "#3B6D11", fontWeight: "600" }}
                            >
                              Visit Official Website 🔗
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>No website specified</span>
                          )}
                        </div>
                      </div>

                      <span className={placedStudents.length > 0 ? "badge-success" : "badge-neutral"}>
                        {placedStudents.length} Placed Student{placedStudents.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Placed Students & Feedback Section */}
                    <div>
                      <h4 style={{ color: "#1E293B", fontSize: "1rem", marginBottom: "12px", fontWeight: "700" }}>
                        🎓 Placed Students & Interview Feedback ({placedStudents.length}):
                      </h4>

                      {placedStudents.length === 0 ? (
                        <p style={{ color: "#64748B", fontSize: "0.9rem", fontStyle: "italic" }}>
                          No students currently recorded as placed in {company.c_name} yet.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                          {placedStudents.map((st) => {
                            const isSelf = currentStudent?.sId === st.sId;

                            // 1. Fetch feedback URL directly from shortlisted_student table
                            const studentShortlists = shortlists.filter((sl) => sl.student?.sId === st.sId);
                            const shortlistMatch = studentShortlists.find(
                              (sl) =>
                                sl.feedbackUrl &&
                                (sl.round?.drive?.company?.comp_id === company.comp_id ||
                                  sl.round?.drive?.company?.c_name?.toLowerCase() === company.c_name.toLowerCase())
                            );
                            const shortlistFeedbackUrl = shortlistMatch?.feedbackUrl;

                            // 2. Check local feedback storage fallback
                            const localFb = feedbacks.find(
                              (f) => f.studentId === st.sId && f.companyId === company.comp_id
                            );

                            const effectiveFeedbackUrl = shortlistFeedbackUrl || localFb?.feedbackUrl;
                            const effectiveNotes = localFb?.notes;

                            return (
                              <div
                                key={st.sId}
                                style={{
                                  padding: "14px 16px",
                                  borderRadius: "12px",
                                  background: "#EEF2FF",
                                  border: "1px solid #CBD5E1",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  gap: "8px",
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ color: "#0F172A", fontSize: "1rem" }}>{st.name}</strong>
                                    <span className="badge-success" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                                      Placed ✓
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "2px" }}>
                                    Reg: {st.reg_no} · {st.department} ({st.batch_year})
                                  </div>
                                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                                    CGPA: {st.cgpa} / 10.0
                                  </div>
                                </div>

                                {/* Feedback Link & Button */}
                                <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: "8px", marginTop: "4px" }}>
                                  {effectiveFeedbackUrl ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <a
                                          href={effectiveFeedbackUrl.startsWith("http") ? effectiveFeedbackUrl : `https://${effectiveFeedbackUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="badge-process"
                                          style={{ display: "inline-block", textDecoration: "none", width: "fit-content" }}
                                        >
                                          📝 View Interview Feedback →
                                        </a>
                                        {isSelf && (
                                          <button
                                            type="button"
                                            className="badge-neutral"
                                            style={{ border: "none", cursor: "pointer", fontSize: "0.75rem" }}
                                            onClick={() => handleOpenFeedbackModal(st, company)}
                                          >
                                            ✏️ Edit My Link
                                          </button>
                                        )}
                                      </div>
                                      {effectiveNotes && (
                                        <p style={{ fontSize: "0.8rem", color: "#1E293B", fontStyle: "italic", margin: "2px 0 0" }}>
                                          "{effectiveNotes}"
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ fontSize: "0.82rem", color: "#64748B", fontStyle: "italic" }}>
                                        No interview feedback uploaded yet by student.
                                      </span>
                                      {isSelf && (
                                        <button
                                          type="button"
                                          className="badge-process"
                                          style={{ border: "none", cursor: "pointer", fontSize: "0.78rem" }}
                                          onClick={() => handleOpenFeedbackModal(st, company)}
                                        >
                                          + Upload My Feedback
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal for adding/editing interview feedback */}
      {selectedStudentForFeedback && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>📝 Add Interview Feedback Link</h3>
              <button
                type="button"
                onClick={() => setSelectedStudentForFeedback(null)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="alert-process-box">
              <strong>
                Candidate: {selectedStudentForFeedback.student.name} ({selectedStudentForFeedback.company.c_name})
              </strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                Add Google Form, Notion doc, or interview review URL for this candidate.
              </p>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>
                Feedback / Interview Experience URL *
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/forms/... or https://notion.so/..."
                value={feedbackUrlInput}
                onChange={(e) => setFeedbackUrlInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  margin: "6px 0 14px",
                }}
              />

              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>
                Key Highlights / Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Cleared 3 rounds: Online Assessment, Technical Interview, and HR round."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  marginTop: "6px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedStudentForFeedback(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeedback}
                className="badge-success"
                style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}
              >
                Save Feedback Link
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentPageLayout>
  );
}

export default StudentCompanies;
