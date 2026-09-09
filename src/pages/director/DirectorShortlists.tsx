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

  // Load all drives
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

  // When drive changes, load its rounds and registrations
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

  // When round changes, load shortlisted students for that round
  useEffect(() => {
    if (!selectedRoundId) {
      setShortlistedList([]);
      return;
    }

    void getShortlistedByRound(selectedRoundId)
      .then((data) => setShortlistedList(data))
      .catch(() => setError("Unable to load shortlisted students."));
  }, [selectedRoundId]);

  const currentRoundIndex = rounds.findIndex((r) => r.roundId === selectedRoundId);
  const isFirstRound = currentRoundIndex === 0;
  const currentRound = rounds.find((r) => r.roundId === selectedRoundId);
  const nextRound = currentRoundIndex >= 0 && currentRoundIndex < rounds.length - 1 ? rounds[currentRoundIndex + 1] : null;
  const prevRound = currentRoundIndex > 0 ? rounds[currentRoundIndex - 1] : null;
  const currentDrive = drives.find((d) => d.driveId === selectedDriveId);

  // Single candidate shortlist
  const handleAddShortlist = async () => {
    if (!selectedRoundId || !selectedStudentToShortlist) return;

    try {
      setError("");
      setMessage("");
      const result = await shortlistStudent(selectedRoundId, selectedStudentToShortlist);
      setShortlistedList((prev) => [...prev, result]);
      setMessage("Candidate shortlisted successfully.");
      setSelectedStudentToShortlist(null);
    } catch {
      setError("Failed to shortlist candidate.");
    }
  };

  // Bulk shortlist all remaining registered students for Round 1
  const handleShortlistAllRegistered = async () => {
    if (!selectedRoundId || availableStudentsToShortlist.length === 0) return;

    try {
      setIsBulkAdding(true);
      setError("");
      setMessage("");

      const addedList: ShortlistedStudent[] = [];
      for (const reg of availableStudentsToShortlist) {
        const res = await shortlistStudent(selectedRoundId, reg.student.sId);
        addedList.push(res);
      }

      setShortlistedList((prev) => [...prev, ...addedList]);
      setMessage(`Successfully shortlisted all ${addedList.length} registered candidates!`);
    } catch {
      setError("Failed to shortlist some candidates.");
    } finally {
      setIsBulkAdding(false);
    }
  };

  // Update status: when SELECTED, auto-advances to next round in backend
  const handleUpdateStatus = async (shortlistId: number, newStatus: string) => {
    try {
      setError("");
      setMessage("");
      const updated = await updateShortlistStatus(shortlistId, newStatus);
      setShortlistedList((prev) => prev.map((s) => (s.shortlistId === shortlistId ? updated : s)));

      const studentName = updated.student?.name || "Candidate";
      if (newStatus === "SELECTED") {
        if (nextRound) {
          setMessage(`✓ ${studentName} marked as SELECTED and automatically advanced to "${nextRound.roundName}" with status PENDING!`);
        } else {
          setMessage(`★ ${studentName} marked as SELECTED in the Final Round! Placed at ${currentDrive?.company?.c_name ?? "Company"}.`);
        }
      } else if (newStatus === "REJECTED") {
        setMessage(`✕ ${studentName} marked as REJECTED.`);
      } else {
        setMessage(`ℹ ${studentName} status set to ${newStatus}.`);
      }
    } catch {
      setError("Failed to update status.");
    }
  };

  const handleDeleteShortlist = async (shortlistId: number) => {
    try {
      await deleteShortlist(shortlistId);
      setShortlistedList((prev) => prev.filter((s) => s.shortlistId !== shortlistId));
      setMessage("Candidate removed from this round.");
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

        {message && (
          <div className="alert-box success-alert" role="status">
            <span>{message}</span>
            <button type="button" className="close-alert" onClick={() => setMessage("")}>×</button>
          </div>
        )}
        {error && (
          <div className="alert-box error-alert" role="alert">
            <span>{error}</span>
            <button type="button" className="close-alert" onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Drive Selector */}
        <div className="selectors-row">
          <div className="selector-group">
            <label htmlFor="sl-drive-select">Select Drive</label>
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
        </div>

        {/* Round Pipeline Stepper / Breadcrumbs */}
        {rounds.length > 0 && (
          <div className="pipeline-stepper-container">
            <div className="pipeline-stepper-label">Recruitment Stages:</div>
            <div className="pipeline-stepper">
              {rounds.map((r, index) => {
                const isActive = r.roundId === selectedRoundId;
                return (
                  <div key={r.roundId} className="stepper-item-wrap">
                    <button
                      type="button"
                      className={`stepper-button ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedRoundId(r.roundId)}
                    >
                      <span className="stepper-number">{index + 1}</span>
                      <div className="stepper-text">
                        <span className="stepper-title">{r.roundName}</span>
                        {r.isFinal && <span className="stepper-badge">Final</span>}
                      </div>
                    </button>
                    {index < rounds.length - 1 && <span className="stepper-arrow">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Round 1: Manual shortlisting from registered students */}
        {selectedRoundId && isFirstRound && (
          <div className="shortlist-form-card">
            <div className="form-field" style={{ flex: 1 }}>
              <label htmlFor="add-student-select">
                <strong>Shortlist Registered Student for Round 1:</strong>
              </label>
              <select
                id="add-student-select"
                value={selectedStudentToShortlist ?? ""}
                onChange={(e) => setSelectedStudentToShortlist(Number(e.target.value))}
              >
                <option value="">Select registered candidate...</option>
                {availableStudentsToShortlist.map((reg) => (
                  <option key={reg.student.sId} value={reg.student.sId}>
                    {reg.student.name} ({reg.student.reg_no}) - {reg.student.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="shortlist-actions-group">
              <button
                type="button"
                className="add-btn"
                disabled={!selectedStudentToShortlist}
                onClick={() => void handleAddShortlist()}
              >
                + Shortlist Candidate
              </button>

              {availableStudentsToShortlist.length > 0 && (
                <button
                  type="button"
                  className="bulk-add-btn"
                  disabled={isBulkAdding}
                  onClick={() => void handleShortlistAllRegistered()}
                  title="Shortlist all remaining applicants for Round 1 at once"
                >
                  {isBulkAdding ? "Shortlisting..." : `+ Shortlist All Registered (${availableStudentsToShortlist.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Round 2+: Automated Pipeline Notice */}
        {selectedRoundId && !isFirstRound && (
          <div className="pipeline-notice-banner">
            <div className="notice-icon">⚡</div>
            <div className="notice-content">
              <strong>Automated Round Progression Active:</strong>
              <p>
                Candidates marked <strong>SELECTED</strong> in <em>{prevRound?.roundName ?? "the previous round"}</em> are
                automatically added to this round with <strong>PENDING</strong> status. You do not need to manually shortlist candidates.
              </p>
              {!showManualAddForNextRounds ? (
                <button
                  type="button"
                  className="toggle-manual-add"
                  onClick={() => setShowManualAddForNextRounds(true)}
                >
                  + Need to manually add an exception candidate?
                </button>
              ) : (
                <div className="manual-add-row">
                  <select
                    value={selectedStudentToShortlist ?? ""}
                    onChange={(e) => setSelectedStudentToShortlist(Number(e.target.value))}
                  >
                    <option value="">Select registered candidate...</option>
                    {availableStudentsToShortlist.map((reg) => (
                      <option key={reg.student.sId} value={reg.student.sId}>
                        {reg.student.name} ({reg.student.reg_no}) - {reg.student.department}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="add-btn"
                    disabled={!selectedStudentToShortlist}
                    onClick={() => void handleAddShortlist()}
                  >
                    Add Candidate
                  </button>
                  <button
                    type="button"
                    className="cancel-manual-btn"
                    onClick={() => setShowManualAddForNextRounds(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table of Candidates */}
        {isLoading ? (
          <p>Loading shortlist records from database...</p>
        ) : (
          <div className="shortlist-table-container">
            <div className="table-header-info">
              <h3>
                {currentRound?.roundName ?? "Round Candidates"}
                {currentRound?.isFinal && <span className="final-tag">Final Round</span>}
              </h3>
              <span className="count-badge">{shortlistedList.length} Candidate(s)</span>
            </div>

            <table className="shortlist-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg No</th>
                  <th>Department</th>
                  <th>Round</th>
                  <th>Status (Change to Advance)</th>
                  <th>Progression</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shortlistedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#6b7280" }}>
                      {isFirstRound ? (
                        "No candidates shortlisted for Round 1 yet. Select and add candidates above."
                      ) : (
                        <div>
                          <p style={{ fontWeight: 600, color: "#374151" }}>No candidates in this round yet.</p>
                          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                            Go to <strong>{prevRound?.roundName ?? "Previous Round"}</strong> and change candidate status to <strong>SELECTED</strong> to automatically advance them here!
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  shortlistedList.map((item) => {
                    const statusVal = item.status || "PENDING";
                    return (
                      <tr key={item.shortlistId}>
                        <td>
                          <strong>{item.student?.name}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {item.student?.email}
                          </div>
                        </td>
                        <td>{item.student?.reg_no || "-"}</td>
                        <td>{item.student?.department || "-"}</td>
                        <td>
                          <span className="round-pill-tag">
                            {item.round?.roundName || "Round"}
                          </span>
                        </td>
                        <td>
                          <select
                            className={`status-select status-${statusVal.toLowerCase()}`}
                            value={statusVal}
                            onChange={(e) => void handleUpdateStatus(item.shortlistId, e.target.value)}
                          >
                            <option value="SELECTED">SELECTED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="WAITLISTED">WAITLISTED</option>
                          </select>
                        </td>
                        <td>
                          {statusVal === "SELECTED" && (
                            <span className="progression-pill pill-selected">
                              {nextRound ? `→ In Next: ${nextRound.roundName} (Pending)` : "★ Cleared Final (Placed)"}
                            </span>
                          )}
                          {statusVal === "REJECTED" && (
                            <span className="progression-pill pill-rejected">
                              ✕ Eliminated
                            </span>
                          )}
                          {statusVal === "PENDING" && (
                            <span className="progression-pill pill-pending">
                              ⏳ Under Review
                            </span>
                          )}
                          {statusVal === "WAITLISTED" && (
                            <span className="progression-pill pill-waitlisted">
                              ⏸ Waitlisted
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => void handleDeleteShortlist(item.shortlistId)}
                          >
                            Remove
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
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorShortlists;
