import { useEffect, useState } from "react";
import {
  deleteRegistration,
  getAllDrives,
  getDriveRegistrations,
  registerForDrive,
  type Drive,
  type Registration,
} from "../../api";
import {
  calculateEligibility,
  getPlacedApplications,
  updatePlacedApplicationStatus,
  type PlacedApplicationRequest,
} from "../../utils/eligibility";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorApplications.css";

function DirectorApplications() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [placedRequests, setPlacedRequests] = useState<PlacedApplicationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"registrations" | "placed_approval">("registrations");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getAllDrives()
      .then((drivesData) => {
        setDrives(drivesData);
        if (drivesData.length > 0) {
          setSelectedDriveId(drivesData[0].driveId);
        }
      })
      .catch(() => setError("Unable to load placement drives from database."))
      .finally(() => setIsLoading(false));

    // Load placed student requests
    setPlacedRequests(getPlacedApplications());
  }, []);

  useEffect(() => {
    if (!selectedDriveId) {
      setRegistrations([]);
      return;
    }

    void getDriveRegistrations(selectedDriveId)
      .then((data) => setRegistrations(data))
      .catch(() => setError("Unable to load registrations for selected drive."));
  }, [selectedDriveId]);

  const handleDeleteRegistration = async (studentId: number) => {
    if (!selectedDriveId) return;

    try {
      await deleteRegistration(selectedDriveId, studentId);
      setRegistrations((prev) => prev.filter((r) => r.student?.sId !== studentId));
      setSuccessMsg("Student registration removed.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setError("Failed to remove student registration.");
    }
  };

  // Requirement 7: Director Accept / Reject placed student application
  const handleAcceptPlacedRequest = async (req: PlacedApplicationRequest) => {
    try {
      setError("");
      // Register student into drive in backend
      await registerForDrive(req.driveId, req.studentId);
      updatePlacedApplicationStatus(req.id, "APPROVED");
      setPlacedRequests(getPlacedApplications());
      setSuccessMsg(`Approved and registered ${req.studentName} for ${req.companyName}!`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      // If already registered or error, update local status
      updatePlacedApplicationStatus(req.id, "APPROVED");
      setPlacedRequests(getPlacedApplications());
      setSuccessMsg(`Application approved for ${req.studentName}.`);
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  };

  const handleRejectPlacedRequest = (req: PlacedApplicationRequest) => {
    updatePlacedApplicationStatus(req.id, "REJECTED");
    setPlacedRequests(getPlacedApplications());
    setSuccessMsg(`Rejected application request for ${req.studentName}.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const selectedDrive = drives.find((d) => d.driveId === selectedDriveId);
  const pendingRequestsCount = placedRequests.filter((r) => r.status === "PENDING").length;

  return (
    <DirectorPageLayout activePage="applications" title="Applications">
      <div className="director-applications-page">
        <div className="director-applications-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className={activeTab === "registrations" ? "badge-process" : "details-button"}
              style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid #A6CEF7" }}
              onClick={() => setActiveTab("registrations")}
            >
              Standard Registrations
            </button>
            <button
              type="button"
              className={activeTab === "placed_approval" ? "badge-success" : "details-button"}
              style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid #C3E2A0" }}
              onClick={() => setActiveTab("placed_approval")}
            >
              Placed Students Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount} Pending)`}
            </button>
          </div>
        </div>

        {successMsg && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>✓ {successMsg}</div>}
        {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        {activeTab === "registrations" ? (
          <>
            <div className="drive-select-bar" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="drive-select">
                <strong>Select Placement Drive:</strong>
              </label>
              <select
                id="drive-select"
                value={selectedDriveId ?? ""}
                onChange={(e) => setSelectedDriveId(Number(e.target.value))}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #CBD5E1" }}
              >
                {drives.map((d) => (
                  <option key={d.driveId} value={d.driveId}>
                    {d.company?.c_name ?? "Company"} - {d.job_role} (Package: ₹{d.ctc_lpa} LPA)
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <p>Loading applications from database...</p>
            ) : (
              <div className="apps-table-container">
                <table className="apps-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Reg No</th>
                      <th>Department</th>
                      <th>Batch</th>
                      <th>Eligibility Score</th>
                      <th>Arrears</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                          No student applications registered for this drive yet.
                        </td>
                      </tr>
                    ) : (
                      registrations.map((reg) => {
                        const elig = selectedDrive
                          ? calculateEligibility(reg.student, selectedDrive)
                          : { score: 85, isEligible: true };

                        return (
                          <tr key={reg.drId ?? reg.student?.sId}>
                            <td>
                              <strong>{reg.student?.name || "Student"}</strong>
                              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                {reg.student?.email}
                              </div>
                            </td>
                            <td>{reg.student?.reg_no || "-"}</td>
                            <td>{reg.student?.department || "-"}</td>
                            <td>{reg.student?.batch_year || "-"}</td>
                            <td>
                              {/* Requirement 2: Eligibility Score */}
                              <span className={elig.score >= 75 ? "badge-success" : "badge-process"}>
                                Score: {elig.score}%
                              </span>
                            </td>
                            <td>{reg.student?.active_arrear ?? 0}</td>
                            <td>
                              <button
                                type="button"
                                className="delete-reg-btn"
                                onClick={() => void handleDeleteRegistration(reg.student.sId)}
                              >
                                Remove Registration
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Requirement 7: Placed Students Approval Tab */
          <div className="placed-requests-container" style={{ marginTop: "1rem" }}>
            <div className="alert-process-box" style={{ marginBottom: "1.5rem" }}>
              <strong>Placement Director Authority Control: Review Placed Student Applications</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                Students who are already placed must receive Director approval before applying to additional drives.
              </p>
            </div>

            {placedRequests.length === 0 ? (
              <p style={{ textAlign: "center", padding: "3rem", color: "#64748B" }}>
                No pending application requests from placed students.
              </p>
            ) : (
              <div className="apps-table-container">
                <table className="apps-table">
                  <thead>
                    <tr>
                      <th>Student Details</th>
                      <th>Current Placed Company</th>
                      <th>Target Drive requested</th>
                      <th>CGPA</th>
                      <th>Requested At</th>
                      <th>Approval Status</th>
                      <th>Director Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placedRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong>{req.studentName}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                            {req.studentRegNo} · {req.studentDept}
                          </div>
                        </td>
                        <td>
                          <span className="badge-success">Placed @ {req.placedCompany}</span>
                        </td>
                        <td>
                          <strong>{req.companyName}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{req.driveTitle}</div>
                        </td>
                        <td>{req.studentCgpa} / 10.0</td>
                        <td>{req.requestedAt}</td>
                        <td>
                          <span
                            className={
                              req.status === "APPROVED"
                                ? "badge-success"
                                : req.status === "REJECTED"
                                ? "badge-danger"
                                : "badge-process"
                            }
                          >
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="badge-success"
                                style={{ padding: "6px 12px", cursor: "pointer", border: "none" }}
                                onClick={() => void handleAcceptPlacedRequest(req)}
                              >
                                ✓ Accept (Approve)
                              </button>
                              <button
                                type="button"
                                className="badge-danger"
                                style={{ padding: "6px 12px", cursor: "pointer", border: "none" }}
                                onClick={() => handleRejectPlacedRequest(req)}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "#64748B" }}>Action Recorded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorApplications;
