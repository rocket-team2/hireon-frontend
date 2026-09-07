import { useEffect, useState } from "react";
import {
  deleteRegistration,
  getAllDrives,
  getDriveRegistrations,
  type Drive,
  type Registration,
} from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorApplications.css";

function DirectorApplications() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState("");
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
    } catch {
      setError("Failed to remove student registration.");
    }
  };

  return (
    <DirectorPageLayout activePage="applications" title="Applications">
      <div className="director-applications-page">
        <div className="director-applications-header">
          <h1>Drive Applications</h1>
          <p>View students registered for specific placement drives.</p>
        </div>

        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

        <div className="drive-select-bar">
          <label htmlFor="drive-select">
            <strong>Select Placement Drive:</strong>
          </label>
          <select
            id="drive-select"
            value={selectedDriveId ?? ""}
            onChange={(e) => setSelectedDriveId(Number(e.target.value))}
          >
            {drives.map((d) => (
              <option key={d.driveId} value={d.driveId}>
                {d.company?.c_name ?? "Company"} - {d.job_role}
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
                  <th>CGPA</th>
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
                  registrations.map((reg) => (
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
                      <td>{reg.student?.cgpa ?? "-"}</td>
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

export default DirectorApplications;
