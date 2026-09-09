import { useEffect, useState } from "react";
import {
  getCompanies,
  getStudents,
  getStudentSkills,
  updateStudentStatus,
  type Company,
  type Student,
} from "../../api";
import { generateStudentEmailContent, getCompanyLogoUrl } from "../../utils/eligibility";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorStudents.css";

function DirectorStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("Not Placed");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [emailStudent, setEmailStudent] = useState<Student | null>(null);
  const [emailPayload, setEmailPayload] = useState({ subject: "", body: "" });

  useEffect(() => {
    void Promise.all([getStudents(), getCompanies()])
      .then(([studentsData, companiesData]) => {
        setStudents(studentsData);
        setCompanies(companiesData);
      })
      .catch(() => setError("Unable to load students from database."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpdateStatus = async (studentId: number) => {
    try {
      setError("");
      setMessage("");
      const updated = await updateStudentStatus(studentId, selectedStatus, selectedCompanyId);
      setStudents((prev) => prev.map((s) => (s.sId === studentId ? updated : s)));
      setEditingStudentId(null);
      setMessage("Placement status updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch {
      setError("Failed to update student placement status.");
    }
  };

  // Requirement 8: Open email modal for student
  const handleOpenEmailModal = async (st: Student) => {
    setEmailStudent(st);
    try {
      const skillsData = await getStudentSkills(st.sId).catch(() => []);
      const skillsMapped = skillsData.map((item) => ({
        name: item.skill.skillName,
        proficiency: item.proficiency <= 5 ? item.proficiency : Math.round(item.proficiency / 20),
      }));
      const payload = generateStudentEmailContent(st, skillsMapped);
      setEmailPayload(payload);
    } catch {
      const payload = generateStudentEmailContent(st, []);
      setEmailPayload(payload);
    }
  };

  const handleSendEmailApp = () => {
    if (!emailStudent) return;
    const mailtoUrl = `mailto:${encodeURIComponent(emailStudent.email)}?subject=${encodeURIComponent(
      emailPayload.subject
    )}&body=${encodeURIComponent(emailPayload.body)}`;
    window.open(mailtoUrl, "_blank");
    setEmailStudent(null);
  };

  const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      student.reg_no?.toLowerCase().includes(search.toLowerCase()) ||
      student.email?.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === "all" || student.department === deptFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (student.placement_status ?? "Not Placed").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <DirectorPageLayout activePage="students" title="Students">
      <div className="director-students-page">
        {message && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>✓ {message}</div>}
        {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="students-controls">
          <input
            type="text"
            placeholder="Search student by name, reg no, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Not Placed">Not Placed</option>
            <option value="In Process">In Process</option>
          </select>
        </div>

        {isLoading ? (
          <p>Loading students from database...</p>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>CGPA</th>
                  <th>Placement Status</th>
                  <th>Placed Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                      No students match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const isPlaced = st.placement_status === "Placed" || Boolean(st.company);
                    const logoUrl = getCompanyLogoUrl(st.company?.c_name ?? "", st.company?.comp_url);

                    return (
                      <tr key={st.sId}>
                        <td>{st.reg_no || "-"}</td>
                        <td>
                          <strong>{st.name}</strong>
                        </td>
                        <td>{st.department}</td>
                        <td>{st.batch_year}</td>
                        <td>{st.cgpa} / 10.0</td>
                        <td>
                          {editingStudentId === st.sId ? (
                            <select
                              className="status-select"
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                              <option value="Not Placed">Not Placed</option>
                              <option value="Placed">Placed</option>
                              <option value="In Process">In Process</option>
                            </select>
                          ) : (
                            <span className={isPlaced ? "badge-success" : "badge-process"}>
                              {st.placement_status || "Not Placed"}
                            </span>
                          )}
                        </td>
                        <td>
                          {/* Requirements 4 & 5: Company Logo & Placed Company */}
                          {editingStudentId === st.sId ? (
                            <select
                              className="company-select"
                              value={selectedCompanyId ?? ""}
                              onChange={(e) =>
                                setSelectedCompanyId(
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                            >
                              <option value="">No Company</option>
                              {companies.map((c) => (
                                <option key={c.comp_id} value={c.comp_id}>
                                  {c.c_name}
                                </option>
                              ))}
                            </select>
                          ) : isPlaced && st.company?.c_name ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <img
                                src={logoUrl}
                                alt={st.company.c_name}
                                className="company-logo-img"
                                style={{ width: "28px", height: "28px" }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <strong style={{ color: "#3B6D11" }}>{st.company.c_name}</strong>
                            </div>
                          ) : (
                            <span style={{ color: "#94A3B8" }}>-</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {/* Requirement 8: Email trigger button */}
                            <button
                              type="button"
                              className="badge-process"
                              style={{ padding: "4px 8px", cursor: "pointer", border: "none" }}
                              onClick={() => void handleOpenEmailModal(st)}
                            >
                              📧 Email
                            </button>

                            {editingStudentId === st.sId ? (
                              <>
                                <button
                                  type="button"
                                  className="save-status-btn"
                                  onClick={() => void handleUpdateStatus(st.sId)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                  }}
                                  onClick={() => setEditingStudentId(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "1px solid #d1d5db",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                }}
                                onClick={() => {
                                  setEditingStudentId(st.sId);
                                  setSelectedStatus(st.placement_status || "Not Placed");
                                  setSelectedCompanyId(st.company?.comp_id);
                                }}
                              >
                                Edit Status
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Requirement 8: Email Modal for Director */}
        {emailStudent && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "600px" }}>
              <div className="modal-header">
                <h3>📧 Candidate Skill Report Email Payload</h3>
                <button
                  type="button"
                  onClick={() => setEmailStudent(null)}
                  style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}
                >
                  ✕
                </button>
              </div>

              <div className="alert-process-box">
                <strong>Recipient: {emailStudent.name} ({emailStudent.email})</strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                  Pre-formatted student summary with skill proficiencies.
                </p>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#042C53" }}>Subject:</label>
                <input
                  type="text"
                  readOnly
                  value={emailPayload.subject}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", margin: "4px 0 12px", background: "#F8FAFC" }}
                />

                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#042C53" }}>Body Content:</label>
                <textarea
                  readOnly
                  rows={9}
                  value={emailPayload.body}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    background: "#F8FAFC",
                  }}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEmailStudent(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailApp}
                  className="badge-success"
                  style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}
                >
                  Send via Mail Client (mailto:)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorStudents;
