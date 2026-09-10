import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  deleteShortlist,
  getAllDrives,
  getDriveRegistrations,
  getDriveRounds,
  getShortlistedByRound,
  processRoundExcel,
  shortlistStudent,
  updateShortlistStatus,
  type Drive,
  type DriveRound,
  type Registration,
  type ShortlistedStudent,
} from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorShortlists.css";

interface ExcelPreviewData {
  fileName: string;
  totalExtracted: number;
  matchingCount: number;
  nonMatchingCount: number;
  unrecognizedCount: number;
  regNos: string[];
}

function DirectorShortlists() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [rounds, setRounds] = useState<DriveRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [shortlistedList, setShortlistedList] = useState<ShortlistedStudent[]>([]);
  const [selectedStudentToShortlist, setSelectedStudentToShortlist] = useState<number | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Excel Upload State
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewData | null>(null);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setExcelPreview(null);
      return;
    }

    setExcelPreview(null);
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

  // Excel File Parser
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          setError("The uploaded Excel file appears to be empty.");
          return;
        }

        const candidateRegNos = shortlistedList
          .map((s) => s.student?.reg_no)
          .filter((r): r is string => Boolean(r));

        const candidateSet = new Set(candidateRegNos.map((r) => r.trim().toUpperCase()));
        const extractedSet = new Set<string>();

        // 1. Identify target column if header row exists
        let targetColIndex = -1;
        const headerRow = (rawRows[0] || []) as unknown[];
        for (let c = 0; c < headerRow.length; c++) {
          const val = String(headerRow[c] || "").trim().toLowerCase();
          if (
            val.includes("roll") ||
            val.includes("reg") ||
            val.includes("register") ||
            val.includes("student id") ||
            val.includes("htno") ||
            val.includes("hallticket")
          ) {
            targetColIndex = c;
            break;
          }
        }

        if (targetColIndex !== -1) {
          for (let r = 1; r < rawRows.length; r++) {
            const row = rawRows[r] as unknown[];
            const cellVal = String(row?.[targetColIndex] || "").trim().toUpperCase();
            if (cellVal) {
              extractedSet.add(cellVal);
            }
          }
        } else {
          // Fallback: Scan all cells across rows
          for (let r = 0; r < rawRows.length; r++) {
            const row = (rawRows[r] || []) as unknown[];
            for (let c = 0; c < row.length; c++) {
              const cellVal = String(row[c] || "").trim().toUpperCase();
              if (!cellVal) continue;
              if (candidateSet.has(cellVal) || /^[A-Z0-9_-]{3,20}$/i.test(cellVal)) {
                if (!["NAME", "STUDENT NAME", "DEPARTMENT", "DEPT", "EMAIL", "STATUS", "REMARKS"].includes(cellVal)) {
                  extractedSet.add(cellVal);
                }
              }
            }
          }
        }

        const regNos = Array.from(extractedSet);
        if (regNos.length === 0) {
          setError("No valid student roll numbers found in the uploaded file.");
          return;
        }

        const matchingCount = shortlistedList.filter((s) =>
          s.student?.reg_no && candidateSet.has(s.student.reg_no.trim().toUpperCase()) && regNos.includes(s.student.reg_no.trim().toUpperCase())
        ).length;

        const nonMatchingCount = shortlistedList.length - matchingCount;
        const unrecognizedCount = regNos.filter((r) => !candidateSet.has(r)).length;

        setExcelPreview({
          fileName: file.name,
          totalExtracted: regNos.length,
          matchingCount,
          nonMatchingCount,
          unrecognizedCount,
          regNos,
        });

      } catch {
        setError("Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Confirm Excel processing
  const handleConfirmExcelProcessing = async () => {
    if (!selectedRoundId || !excelPreview) return;

    try {
      setIsProcessingExcel(true);
      setError("");
      setMessage("");

      const updatedShortlist = await processRoundExcel(selectedRoundId, excelPreview.regNos);
      setShortlistedList(updatedShortlist);

      const selectedCount = updatedShortlist.filter((s) => s.status === "SELECTED").length;
      const rejectedCount = updatedShortlist.filter((s) => s.status === "REJECTED").length;

      if (nextRound) {
        setMessage(
          `✓ Success! ${selectedCount} candidates marked as SELECTED (automatically advanced to "${nextRound.roundName}" as PENDING) and ${rejectedCount} marked as REJECTED.`
        );
      } else {
        setMessage(
          `★ Success! Final Round Processed: ${selectedCount} candidates marked as SELECTED (Placed) and ${rejectedCount} marked as REJECTED.`
        );
      }

      setExcelPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setError("Failed to process round shortlisting with Excel data.");
    } finally {
      setIsProcessingExcel(false);
    }
  };

  // Download sample template for current round
  const handleDownloadSampleExcel = () => {
    const data = shortlistedList.map((item) => ({
      "Roll No": item.student?.reg_no || "",
      "Student Name": item.student?.name || "",
      "Department": item.student?.department || "",
      "Email": item.student?.email || "",
      "Current Status": item.status || "PENDING",
    }));

    const worksheet = XLSX.utils.json_to_sheet(
      data.length > 0
        ? data
        : [
            {
              "Roll No": "CS202601",
              "Student Name": "John Doe",
              "Department": "CSE",
              "Email": "john@example.com",
              "Current Status": "PENDING",
            },
          ]
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlist Results");

    const driveTitle = currentDrive?.company?.c_name ? `${currentDrive.company.c_name}_` : "";
    const roundTitle = currentRound?.roundName ? currentRound.roundName.replace(/[^a-z0-9]/gi, "_") : "Round";
    XLSX.writeFile(workbook, `${driveTitle}${roundTitle}_Shortlist_Template.xlsx`);
  };

  // Single candidate shortlist manual add
  const handleAddShortlist = async () => {
    if (!selectedRoundId || !selectedStudentToShortlist) return;

    try {
      setError("");
      setMessage("");
      const result = await shortlistStudent(selectedRoundId, selectedStudentToShortlist);
      setShortlistedList((prev) => {
        const exists = prev.some((s) => s.shortlistId === result.shortlistId);
        return exists ? prev : [...prev, result];
      });
      setMessage("Candidate added to round successfully.");
      setSelectedStudentToShortlist(null);
    } catch {
      setError("Failed to add candidate to round.");
    }
  };

  // Update status manually
  const handleUpdateStatus = async (shortlistId: number, newStatus: string) => {
    try {
      setError("");
      setMessage("");
      const updated = await updateShortlistStatus(shortlistId, newStatus);
      setShortlistedList((prev) => prev.map((s) => (s.shortlistId === shortlistId ? updated : s)));

      const studentName = updated.student?.name || "Candidate";
      if (newStatus === "SELECTED") {
        if (nextRound) {
          setMessage(`✓ ${studentName} set to SELECTED and automatically advanced to "${nextRound.roundName}" as PENDING!`);
        } else {
          setMessage(`★ ${studentName} set to SELECTED in Final Round! Placed at ${currentDrive?.company?.c_name ?? "Company"}.`);
        }
      } else if (newStatus === "REJECTED") {
        setMessage(`✕ ${studentName} marked as REJECTED.`);
      } else {
        setMessage(`ℹ ${studentName} status set to ${newStatus}.`);
      }
    } catch {
      setError("Failed to update candidate status.");
    }
  };

  const handleDeleteShortlist = async (shortlistId: number) => {
    try {
      await deleteShortlist(shortlistId);
      setShortlistedList((prev) => prev.filter((s) => s.shortlistId !== shortlistId));
      setMessage("Candidate removed from this round.");
    } catch {
      setError("Failed to remove candidate record.");
    }
  };

  const availableStudentsToShortlist = registrations.filter(
    (reg) => !shortlistedList.some((s) => s.student?.sId === reg.student?.sId)
  );

  const filteredShortlistedList = shortlistedList.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const pendingCount = shortlistedList.filter((s) => s.status === "PENDING").length;
  const selectedCount = shortlistedList.filter((s) => s.status === "SELECTED").length;
  const rejectedCount = shortlistedList.filter((s) => s.status === "REJECTED").length;

  return (
    <DirectorPageLayout activePage="shortlists" title="Shortlists">
      <div className="director-shortlists-page">
        <div className="shortlists-header">
          <h1>Automated Round Shortlisting</h1>
          <p>
            Upload evaluation Excel sheets per round to automatically mark selected candidates for the next round and reject others.
          </p>
        </div>

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

        {/* Round Pipeline Stepper */}
        {rounds.length > 0 && (
          <div className="pipeline-stepper-container">
            <div className="pipeline-stepper-label">Recruitment Stages</div>
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

        {/* Automated Excel Upload & Shortlist Section */}
        {selectedRoundId && (
          <div className="excel-automation-card">
            <div className="excel-card-header">
              <div className="excel-title-group">
                <h2>
                  <span>📊</span> Automated Excel Shortlisting for {currentRound?.roundName || "Round"}
                  <span className="excel-badge-tag">Auto Logic</span>
                </h2>
                <p>
                  Upload an Excel or CSV file containing cleared candidate roll numbers. Matched candidates are marked <strong>SELECTED</strong> (and automatically advanced to <em>{nextRound ? nextRound.roundName : "Final Placement"}</em> as <strong>PENDING</strong>). Unmatched candidates in this round are marked <strong>REJECTED</strong>.
                </p>
              </div>
              <button
                type="button"
                className="template-download-btn"
                onClick={handleDownloadSampleExcel}
                title="Download Excel file pre-filled with candidate roll numbers"
              >
                <span>📥</span> Download Excel Template
              </button>
            </div>

            {/* Dropzone / Upload Button */}
            <div
              className="excel-upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="upload-icon">📁</span>
              <div className="upload-text">Click or drag & drop Excel file (.xlsx, .xls, .csv)</div>
              <div className="upload-hint">Only candidate Roll Numbers / Reg Numbers will be fetched and processed</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden-file-input"
                onChange={handleFileUpload}
              />
            </div>

            {/* Preview Modal / Card */}
            {excelPreview && (
              <div className="excel-preview-card">
                <div className="preview-header">
                  <h3>Preview Shortlist Action</h3>
                  <span className="file-name-pill">📄 {excelPreview.fileName}</span>
                </div>

                <div className="preview-stats-grid">
                  <div className="stat-box stat-extracted">
                    <div className="stat-value">{excelPreview.totalExtracted}</div>
                    <div className="stat-label">Roll Numbers Found in File</div>
                  </div>
                  <div className="stat-box stat-selected">
                    <div className="stat-value">{excelPreview.matchingCount}</div>
                    <div className="stat-label">Will be SELECTED & Advanced ({nextRound ? nextRound.roundName : "Placed"})</div>
                  </div>
                  <div className="stat-box stat-rejected">
                    <div className="stat-value">{excelPreview.nonMatchingCount}</div>
                    <div className="stat-label">Will be REJECTED (Not in Excel)</div>
                  </div>
                </div>

                <div className="preview-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setExcelPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="confirm-btn"
                    disabled={isProcessingExcel}
                    onClick={() => void handleConfirmExcelProcessing()}
                  >
                    {isProcessingExcel ? "Processing Shortlist..." : "✓ Confirm & Apply Shortlist"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Exception Toggle */}
        {selectedRoundId && (
          <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "flex-end" }}>
            {!showManualAdd ? (
              <button
                type="button"
                className="toggle-manual-add"
                onClick={() => setShowManualAdd(true)}
              >
                + Add individual candidate exception
              </button>
            ) : (
              <div className="manual-add-row" style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}>
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
                  onClick={() => setShowManualAdd(false)}
                >
                  Close
                </button>
              </div>
            )}
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
                <span className="count-badge">{shortlistedList.length} Total</span>
              </h3>

              {/* Filter Pills */}
              <div className="status-filters-group">
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  All ({shortlistedList.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "PENDING" ? "active" : ""}`}
                  onClick={() => setStatusFilter("PENDING")}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "SELECTED" ? "active" : ""}`}
                  onClick={() => setStatusFilter("SELECTED")}
                >
                  Selected ({selectedCount})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === "REJECTED" ? "active" : ""}`}
                  onClick={() => setStatusFilter("REJECTED")}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>
            </div>

            <table className="shortlist-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg No</th>
                  <th>Department</th>
                  <th>Round</th>
                  <th>Status</th>
                  <th>Progression</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortlistedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "#6b7280" }}>
                      {shortlistedList.length === 0 ? (
                        isFirstRound ? (
                          "No candidates in Round 1. Registered candidates will automatically populate here as PENDING."
                        ) : (
                          <div>
                            <p style={{ fontWeight: 600, color: "#374151" }}>No candidates in this round yet.</p>
                            <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                              Go to <strong>{prevRound?.roundName ?? "Previous Round"}</strong> and process Excel results or mark status as <strong>SELECTED</strong> to automatically advance candidates here!
                            </p>
                          </div>
                        )
                      ) : (
                        `No candidates found with status "${statusFilter}".`
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredShortlistedList.map((item) => {
                    const statusVal = item.status || "PENDING";
                    return (
                      <tr key={item.shortlistId}>
                        <td>
                          <strong>{item.student?.name}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {item.student?.email}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{item.student?.reg_no || "-"}</span>
                        </td>
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
                            <option value="PENDING">PENDING</option>
                            <option value="SELECTED">SELECTED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="WAITLISTED">WAITLISTED</option>
                          </select>
                        </td>
                        <td>
                          {statusVal === "SELECTED" && (
                            <span className="progression-pill pill-selected">
                              {nextRound ? `→ Advanced to ${nextRound.roundName}` : "★ Cleared Final (Placed)"}
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
