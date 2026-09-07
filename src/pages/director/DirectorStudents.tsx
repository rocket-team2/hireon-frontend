import { useEffect, useState } from "react";
import {
  getCompanies,
  getStudents,
  updateStudentStatus,
  type Company,
  type Student,
} from "../../api";
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
      setMessage("Placement status updated.");
    } catch {
      setError("Failed to update student placement status.");
    }
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
        <div className="students-header">
          <h1>Student Directory</h1>
          <p>View and manage all registered students and their placement status.</p>
        </div>

        {message && <p role="status" style={{ color: "#059669", marginBottom: "1rem" }}>{message}</p>}
        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

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
                  <th>Name</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>CGPA</th>
                  <th>Arrears</th>
                  <th>Placement Status</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                      No students match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.sId}>
                      <td>{st.reg_no || "-"}</td>
                      <td>
                        <strong>{st.name}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{st.email}</div>
                      </td>
                      <td>{st.department}</td>
                      <td>{st.batch_year}</td>
                      <td>{st.cgpa}</td>
                      <td>{st.active_arrear}</td>
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
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                st.placement_status?.toLowerCase() === "placed"
                                  ? "#059669"
                                  : "#4b5563",
                            }}
                          >
                            {st.placement_status || "Not Placed"}
                          </span>
                        )}
                      </td>
                      <td>
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
                        ) : (
                          st.company?.c_name || "-"
                        )}
                      </td>
                      <td>
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
                                marginLeft: "0.5rem",
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorStudents;
