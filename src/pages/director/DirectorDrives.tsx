import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  departmentsFromDrive,
  getAllDrives,
  getDriveRegistrations,
  type Drive as ApiDrive,
} from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorDrives.css";

interface DriveWithStats {
  drive: ApiDrive;
  registrationsCount: number;
}

function DirectorDrives() {
  const [drivesWithStats, setDrivesWithStats] = useState<DriveWithStats[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const drives = await getAllDrives();
        // Fetch all registrations in parallel, not sequentially
        const allRegs = await Promise.all(
          drives.map((d) => getDriveRegistrations(d.driveId))
        );
        const stats = drives.map((d, i) => ({
          drive: d,
          registrationsCount: allRegs[i].length,
        }));
        setDrivesWithStats(stats);
      } catch {
        setError("Unable to load placement drives from database.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <DirectorPageLayout activePage="drives" title="Placement Drives">
      <div className="director-drives-page">
        <div className="director-drives-header">
          <div>
            <h1>Placement Drives</h1>
            <p>View and manage all ongoing and past placement drives.</p>
          </div>

          <button
            type="button"
            className="create-drive-btn"
            onClick={() => navigate("/create-drive")}
          >
            + Create New Drive
          </button>
        </div>

        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

        {isLoading ? (
          <p>Loading drives from database...</p>
        ) : (
          <div className="drives-list-director">
            {drivesWithStats.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No placement drives created yet.</p>
            ) : (
              drivesWithStats.map(({ drive, registrationsCount }) => {
                const depts = departmentsFromDrive(drive.allowed_dept);
                return (
                  <div key={drive.driveId} className="director-drive-card">
                    <div className="drive-main-info">
                      <h3>{drive.company?.c_name ?? "Company"}</h3>
                      <p>
                        <strong>Role:</strong> {drive.job_role} | <strong>CTC:</strong> ₹{drive.ctc_lpa} LPA
                      </p>
                      <div className="drive-tags">
                        <span><strong>Max Arrear:</strong> {drive.max_arrear}</span>
                        <span><strong>Target Batch:</strong> {drive.target_cg_batch}</span>
                        <span><strong>Registered:</strong> {registrationsCount}</span>
                        <span>
                          <strong>Allowed Depts:</strong>{" "}
                          {depts.length > 0 ? depts.join(", ") : "All"}
                        </span>
                      </div>
                    </div>

                    <div className="drive-action-buttons">
                      <button
                        type="button"
                        className="action-edit-btn"
                        onClick={() => navigate(`/create-drive?driveId=${drive.driveId}`)}
                      >
                        Edit Drive
                      </button>
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

export default DirectorDrives;
