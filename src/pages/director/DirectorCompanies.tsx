import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  addCompany,
  getCompanies,
  getShortlistedByStudent,
  getStudents,
  type Company,
  type ShortlistedStudent,
  type Student,
} from "../../api";
import CompanyLogo from "../../components/CompanyLogo";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorCompanies.css";

function DirectorCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistedStudent[]>([]);
  const [cName, setCName] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [companiesData, studentsData] = await Promise.all([
          getCompanies().catch(() => []),
          getStudents().catch(() => []),
        ]);
        setCompanies(companiesData);
        setStudents(studentsData);

        // Fetch shortlisted_student database records for all students
        const shortlistedPromises = studentsData.map((st) =>
          getShortlistedByStudent(st.sId).catch(() => [])
        );
        const allShortlistsNested = await Promise.all(shortlistedPromises);
        setShortlists(allShortlistsNested.flat());
      } catch {
        setError("Unable to load companies from database.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAddCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const newCompany = await addCompany({
        c_name: cName.trim(),
        comp_url: compUrl.trim() || undefined,
      });
      setCompanies((prev) => [...prev, newCompany]);
      setCName("");
      setCompUrl("");
      setMessage("Company added successfully.");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setError("Failed to add company. Check details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DirectorPageLayout activePage="companies" title="Companies Visited">
      <div className="director-companies-page">

        {message && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>✓ {message}</div>}
        {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="add-company-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#0F172A" }}>Add New Recruiting Corporate Partner</h2>
          <form className="add-company-form" onSubmit={(e) => void handleAddCompany(e)}>
            <div className="form-field">
              <label htmlFor="company-name">Company Name *</label>
              <input
                id="company-name"
                type="text"
                placeholder="e.g. Google, Microsoft, TCS, Infosys"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="company-url">Official Website URL</label>
              <input
                id="company-url"
                type="url"
                placeholder="https://company.com"
                value={compUrl}
                onChange={(e) => setCompUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="add-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : "+ Add Company"}
            </button>
          </form>
        </div>

        {isLoading ? (
          <p>Loading companies from database...</p>
        ) : (
          <div className="companies-list" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {companies.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No companies registered in database.</p>
            ) : (
              companies.map((c) => {
                const placedStudents = students.filter((st) => {
                  if (st.placement_status !== "Placed") return false;
                  if (st.company?.comp_id && st.company.comp_id === c.comp_id) return true;
                  if (st.company?.c_name && st.company.c_name.toLowerCase() === c.c_name.toLowerCase()) return true;
                  return false;
                });

                return (
                  <div
                    key={c.comp_id}
                    className="director-company-card-full"
                    style={{
                      padding: "24px",
                      borderRadius: "16px",
                      border: "1px solid #E2E8F0",
                      background: "#ffffff",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <CompanyLogo companyName={c.c_name} companyUrl={c.comp_url} size={52} />
                        <div>
                          <h2 style={{ margin: "0 0 4px", color: "#0F172A", fontSize: "1.3rem", fontWeight: "800" }}>{c.c_name}</h2>
                          {c.comp_url ? (
                            <a
                              href={c.comp_url.startsWith("http") ? c.comp_url : `https://${c.comp_url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: "0.85rem", color: "#3B6D11", fontWeight: "600" }}
                            >
                              Visit Website 🔗
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

                    {/* Placed Students & Feedback Links */}
                    <div>
                      <h4 style={{ color: "#1E293B", fontSize: "0.95rem", marginBottom: "12px", fontWeight: "700" }}>
                        🎓 Placed Students ({placedStudents.length}):
                      </h4>

                      {placedStudents.length === 0 ? (
                        <p style={{ color: "#64748B", fontSize: "0.88rem", fontStyle: "italic" }}>
                          No students currently recorded as placed in {c.c_name}.
                        </p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                          {placedStudents.map((st) => {
                            // Fetch feedback URL directly from shortlisted_student database records
                            const studentShortlists = shortlists.filter((sl) => sl.student?.sId === st.sId);
                            const shortlistMatch = studentShortlists.find(
                              (sl) =>
                                sl.feedbackUrl &&
                                (sl.round?.drive?.company?.comp_id === c.comp_id ||
                                  sl.round?.drive?.company?.c_name?.toLowerCase() === c.c_name.toLowerCase())
                            );
                            const databaseFeedbackUrl = shortlistMatch?.feedbackUrl;

                            return (
                              <div
                                key={st.sId}
                                style={{
                                  padding: "14px 16px",
                                  borderRadius: "12px",
                                  background: "#F8FAFC",
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
    </DirectorPageLayout>
  );
}

export default DirectorCompanies;
