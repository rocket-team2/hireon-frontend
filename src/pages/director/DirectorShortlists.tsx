import { useEffect, useState } from "react";
import {
  deleteShortlist,
  getAllDrives,
  getDriveRegistrations,
  getDriveRounds,
  getShortlistedByRound,
  shortlistStudent,
  updateShortlistStatus,
  type Drive,
  type DriveRound,
  type Registration,
  type ShortlistedStudent,
} from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorShortlists.css";

function DirectorShortlists() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [rounds, setRounds] = useState<DriveRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [shortlistedList, setShortlistedList] = useState<ShortlistedStudent[]>([]);
  const [selectedStudentToShortlist, setSelectedStudentToShortlist] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getAllDrives()
      .then((data) => {
        setDrives(data);
        if (data.length > 0) {
          setSelectedDriveId(data[0].driveId);
        }
      })
      .catch(() => setError("Unable to load drives from database."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDriveId) {
      setRounds([]);
      setRegistrations([]);
      return;
    }

    void Promise.all([
      getDriveRounds(selectedDriveId),
      getDriveRegistrations(selectedDriveId),
    ])
      .then(([roundsData, regsData]) => {
        setRounds(roundsData);
        setRegistrations(regsData);
        if (roundsData.length > 0) {
          setSelectedRoundId(roundsData[0].roundId);
        } else {
          setSelectedRoundId(null);
        }
      })
      .catch(() => setError("Unable to load round data."));
  }, [selectedDriveId]);

  useEffect(() => {
    if (!selectedRoundId) {
      setShortlistedList([]);
      return;
    }

    void getShortlistedByRound(selectedRoundId)
      .then((data) => setShortlistedList(data))
      .catch(() => setError("Unable to load shortlisted students."));
  }, [selectedRoundId]);

  const handleAddShortlist = async () => {
    if (!selectedRoundId || !selectedStudentToShortlist) return;

    try {
      setError("");
      setMessage("");
      const result = await shortlistStudent(selectedRoundId, selectedStudentToShortlist);
      setShortlistedList((prev) => [...prev, result]);
      setMessage("Student shortlisted successfully.");
      setSelectedStudentToShortlist(null);
    } catch {
      setError("Failed to shortlist student.");
    }
  };

  const handleUpdateStatus = async (shortlistId: number, newStatus: string) => {
    try {
      const updated = await updateShortlistStatus(shortlistId, newStatus);
      setShortlistedList((prev) => prev.map((s) => (s.shortlistId === shortlistId ? updated : s)));
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleDeleteShortlist = async (shortlistId: number) => {
    try {
      await deleteShortlist(shortlistId);
      setShortlistedList((prev) => prev.filter((s) => s.shortlistId !== shortlistId));
    } catch {
      setError("Failed to remove shortlist record.");
    }
  };

  const availableStudentsToShortlist = registrations.filter(
    (reg) => !shortlistedList.some((s) => s.student?.sId === reg.student?.sId)
  );

  return (
    <DirectorPageLayout activePage="shortlists" title="Shortlists">
      <div className="director-shortlists-page">

        {message && <p role="status" style={{ color: "#059669", marginBottom: "1rem" }}>{message}</p>}
        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

        <div className="selectors-row">
          <div className="selector-group">
            <label htmlFor="sl-drive-select">Drive</label>
            <select
              id="sl-drive-select"
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

          <div className="selector-group">
            <label htmlFor="sl-round-select">Recruitment Round</label>
            <select
              id="sl-round-select"
              value={selectedRoundId ?? ""}
              onChange={(e) => setSelectedRoundId(Number(e.target.value))}
            >
              {rounds.map((r) => (
                <option key={r.roundId} value={r.roundId}>
                  {r.roundName} {r.isFinal ? "(Final)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedRoundId && (
          <div className="shortlist-form-card">
            <div className="form-field" style={{ flex: 1 }}>
              <label htmlFor="add-student-select">
                <strong>Shortlist Registered Student for Selected Round:</strong>
              </label>
              <select
                id="add-student-select"
                value={selectedStudentToShortlist ?? ""}
                onChange={(e) => setSelectedStudentToShortlist(Number(e.target.value))}
              >
                <option value="">Select student...</option>
                {availableStudentsToShortlist.map((reg) => (
                  <option key={reg.student.sId} value={reg.student.sId}>
                    {reg.student.name} ({reg.student.reg_no}) - {reg.student.department}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="add-btn"
              disabled={!selectedStudentToShortlist}
              onClick={() => void handleAddShortlist()}
            >
              + Shortlist Candidate
            </button>
          </div>
        )}

        {isLoading ? (
          <p>Loading shortlist records from database...</p>
        ) : (
          <div className="shortlist-table-container">
            <table className="shortlist-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg No</th>
                  <th>Department</th>
                  <th>Round</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shortlistedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
                      No students shortlisted for this round yet.
                    </td>
                  </tr>
                ) : (
                  shortlistedList.map((item) => (
                    <tr key={item.shortlistId}>
                      <td>
                        <strong>{item.student?.name}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {item.student?.email}
                        </div>
                      </td>
                      <td>{item.student?.reg_no || "-"}</td>
                      <td>{item.student?.department || "-"}</td>
                      <td>{item.round?.roundName || "Round"}</td>
                      <td>
                        <select
                          className="status-select"
                          value={item.status || "SHORTLISTED"}
                          onChange={(e) => void handleUpdateStatus(item.shortlistId, e.target.value)}
                        >
                          <option value="SHORTLISTED">SHORTLISTED</option>
                          <option value="SELECTED">SELECTED</option>
                          <option value="PASSED">PASSED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => void handleDeleteShortlist(item.shortlistId)}
                        >
                          Remove
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

export default DirectorShortlists;
