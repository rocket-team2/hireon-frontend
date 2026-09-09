import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  departmentsFromDrive,
  getAllDrives,
  getDriveRegistrations,
  type Drive as ApiDrive,
} from "../../api";
import { getCompanyLogoUrl } from "../../utils/eligibility";
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
            <h1>Placement Drives Directory</h1>
            <p>View, manage, and create campus placement opportunities.</p>
          </div>

          <button
            type="button"
            className="badge-success"
            style={{ padding: "10px 18px", fontSize: "0.95rem", cursor: "pointer" }}
            onClick={() => navigate("/create-drive")}
          >
            + Create New Placement Drive
          </button>
        </div>

        {error && <div className="alert-danger-box" role="alert">{error}</div>}

        {isLoading ? (
          <p>Loading drives from database...</p>
        ) : (
          <div className="drives-list-director">
            {drivesWithStats.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No placement drives created yet.</p>
            ) : (
              drivesWithStats.map(({ drive, registrationsCount }) => {
                const depts = departmentsFromDrive(drive.allowed_dept);
                const logoUrl = getCompanyLogoUrl(drive.company?.c_name ?? "", drive.company?.comp_url);

                return (
                  <div key={drive.driveId} className="director-drive-card">
                    <div className="drive-main-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <img
                        src={logoUrl}
                        alt={drive.company?.c_name}
                        className="company-logo-img"
                        style={{ width: "56px", height: "56px" }}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/56?text=CO";
                        }}
                      />

                      <div>
                        <h3>{drive.company?.c_name ?? "Company"}</h3>
                        <p>
                          <strong>Role:</strong> {drive.job_role} | <strong>CTC:</strong> ₹{drive.ctc_lpa} LPA
                        </p>

                        <div className="drive-tags">
                          <span className="badge-process">Max Arrear: {drive.max_arrear}</span>
                          <span className="badge-process">Target Batch: {drive.target_cg_batch}</span>
                          <span className="badge-success">Registrations: {registrationsCount}</span>
                          <span className="badge-process">
                            Allowed Depts: {depts.length > 0 ? depts.join(", ") : "All"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="drive-action-buttons">
                      <button
                        type="button"
                        className="details-button"
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
