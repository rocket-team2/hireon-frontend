import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  createDriveRound,
  deleteDriveRound,
  getAllDrives,
  getDriveRounds,
  type Drive,
  type DriveRound,
} from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorRounds.css";

function DirectorRounds() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<number | null>(null);
  const [rounds, setRounds] = useState<DriveRound[]>([]);
  const [roundName, setRoundName] = useState("");
  const [roundLink, setRoundLink] = useState("");
  const [description, setDescription] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getAllDrives()
      .then((data) => {
        setDrives(data);
        if (data.length > 0) {
          setSelectedDriveId(data[0].driveId);
        }
      })
      .catch(() => setError("Unable to load placement drives from database."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDriveId) {
      setRounds([]);
      return;
    }

    void getDriveRounds(selectedDriveId)
      .then((data) => setRounds(data))
      .catch(() => setError("Unable to load recruitment rounds for this drive."));
  }, [selectedDriveId]);

  const handleCreateRound = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDriveId || !roundName.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const newRound = await createDriveRound(selectedDriveId, {
        roundName: roundName.trim(),
        roundLink: roundLink.trim() || undefined,
        description: description.trim() || undefined,
        isFinal,
      });
      setRounds((prev) => [...prev, newRound]);
      setRoundName("");
      setRoundLink("");
      setDescription("");
      setIsFinal(false);
      setMessage("Recruitment round created successfully.");
    } catch {
      setError("Failed to create recruitment round.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRound = async (roundId: number) => {
    try {
      await deleteDriveRound(roundId);
      setRounds((prev) => prev.filter((r) => r.roundId !== roundId));
    } catch {
      setError("Failed to delete recruitment round.");
    }
  };

  return (
    <DirectorPageLayout activePage="rounds" title="Recruitment Rounds">
      <div className="director-rounds-page">

        {message && <p role="status" style={{ color: "#059669", marginBottom: "1rem" }}>{message}</p>}
        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

        <div className="drive-picker">
          <label htmlFor="round-drive-select">
            <strong>Select Placement Drive:</strong>
          </label>
          <select
            id="round-drive-select"
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

        <div className="add-round-card">
          <h2>Create New Round</h2>
          <form onSubmit={(e) => void handleCreateRound(e)}>
            <div className="round-form-grid">
              <div className="round-form-field">
                <label htmlFor="round-name">Round Name *</label>
                <input
                  id="round-name"
                  type="text"
                  placeholder="e.g. Aptitude Test / Technical Interview"
                  required
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                />
              </div>

              <div className="round-form-field">
                <label htmlFor="round-link">Meeting / Assessment Link</label>
                <input
                  id="round-link"
                  type="url"
                  placeholder="https://test.com or https://meet.google.com"
                  value={roundLink}
                  onChange={(e) => setRoundLink(e.target.value)}
                />
              </div>

              <div className="round-form-field">
                <label htmlFor="round-desc">Description</label>
                <input
                  id="round-desc"
                  type="text"
                  placeholder="Details or requirements for this round"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="round-form-field" style={{ justifyContent: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.2rem" }}>
                  <input
                    type="checkbox"
                    checked={isFinal}
                    onChange={(e) => setIsFinal(e.target.checked)}
                  />
                  Final Placement Round
                </label>
              </div>
            </div>

            <button type="submit" className="add-btn" disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Round"}
            </button>
          </form>
        </div>

        {isLoading ? (
          <p>Loading recruitment rounds from database...</p>
        ) : (
          <div className="rounds-list">
            {rounds.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No rounds created for this drive yet.</p>
            ) : (
              rounds.map((r) => (
                <div key={r.roundId} className="round-item-card">
                  <div className="round-item-info">
                    <h3>
                      {r.roundName} {r.isFinal && <span style={{ color: "#059669", fontSize: "0.85rem" }}>(Final Round)</span>}
                    </h3>
                    <p>{r.description || "No description provided."}</p>
                    {r.roundLink && (
                      <a href={r.roundLink} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: "0.85rem" }}>
                        {r.roundLink}
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    className="delete-round-btn"
                    onClick={() => void handleDeleteRound(r.roundId)}
                  >
                    Delete Round
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorRounds;
