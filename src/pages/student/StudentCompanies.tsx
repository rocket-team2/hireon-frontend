import { useEffect, useState } from "react";
import {
  getCompanies,
  getShortlistedByStudent,
  getStudents,
  type Company,
  type ShortlistedStudent,
  type Student,
} from "../../api";
import CompanyLogo from "../../components/CompanyLogo";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentCompanies.css";

function StudentCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistedStudent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [companiesData, studentsData] = await Promise.all([
          getCompanies().catch(() => []),
          getStudents().catch(() => []),
        ]);
        setCompanies(companiesData);
        setStudents(studentsData);

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

  return (
    <StudentPageLayout activePage="companies" title="Companies Visited">
      <div className="student-companies-page">

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
                        <CompanyLogo companyName={company.c_name} companyUrl={company.comp_url} size={56} />
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
                            // Fetch feedback URL directly from shortlisted_student database records
                            const studentShortlists = shortlists.filter((sl) => sl.student?.sId === st.sId);
                            const shortlistMatch = studentShortlists.find(
                              (sl) =>
                                sl.feedbackUrl &&
                                (sl.round?.drive?.company?.comp_id === company.comp_id ||
                                  sl.round?.drive?.company?.c_name?.toLowerCase() === company.c_name.toLowerCase())
                            );
                            const databaseFeedbackUrl = shortlistMatch?.feedbackUrl;

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

                                {/* Feedback Link */}
                                <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: "8px", marginTop: "4px" }}>
                                  {databaseFeedbackUrl ? (
                                    <a
                                      href={databaseFeedbackUrl.startsWith("http") ? databaseFeedbackUrl : `https://${databaseFeedbackUrl}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="badge-process"
                                      style={{ display: "inline-block", textDecoration: "none", width: "fit-content" }}
                                    >
                                      📝 View Interview Feedback →
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: "0.82rem", color: "#64748B", fontStyle: "italic" }}>
                                      No feedback link provided.
                                    </span>
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
    </StudentPageLayout>
  );
}

export default StudentCompanies;
