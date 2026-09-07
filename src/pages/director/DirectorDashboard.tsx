import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getAllDrives, getDriveRegistrations, getSession, getStudents, type Drive as ApiDrive, type Director } from "../../api";
import DirectorSidebar from "./components/DirectorSidebar";
import DirectorHeader from "./components/DirectorHeader";
import "./DirectorDashboard.css";

interface DashboardDrive {
  id: number;
  companyName: string;
  jobRole: string;
  ctc: number;
  deadline: string;
  registered: number;
  eligible: number;
  shortlisted: number;
}

function DirectorDashboard() {
  const [drives, setDrives] = useState<DashboardDrive[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [placedStudentCount, setPlacedStudentCount] = useState(0);
  const [error, setError] = useState("");
  const [director] = useState<Director | null>(() => {
    const session = getSession();
    return session?.role === "director" ? session.user as Director : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "director") {
      navigate("/director-login-page", { replace: true });
      return;
    }

    const loadDashboard = async () => {
      try {
        const [apiDrives, students] = await Promise.all([getAllDrives(), getStudents()]);
        setStudentCount(students.length);
        setPlacedStudentCount(students.filter((student) => student.placement_status?.toLowerCase() === "placed").length);
        const dashboardDrives = await Promise.all(apiDrives.map(async (drive: ApiDrive) => {
          const registrations = await getDriveRegistrations(drive.driveId);
          return {
            id: drive.driveId,
            companyName: drive.company?.c_name ?? "Company",
            jobRole: drive.job_role,
            ctc: drive.ctc_lpa,
            deadline: new Date(drive.deadline).toLocaleDateString(),
            registered: registrations.length,
            eligible: students.length,
            shortlisted: 0,
          };
        }));
        setDrives(dashboardDrives);
      } catch {
        setError("Unable to load placement data from database.");
      }
    };

    void loadDashboard();
  }, [navigate]);

  const finalYearStudents = studentCount;
  const placedStudents = placedStudentCount;
  const unplacedStudents = finalYearStudents - placedStudents;

  const placementRate = finalYearStudents > 0
    ? ((placedStudents / finalYearStudents) * 100).toFixed(1)
    : "0.0";

  const handleNavigation = (page: string) => {
    switch (page) {
      case "dashboard":
        navigate("/director-dashboard");
        break;
      case "students":
        navigate("/director/students");
        break;
      case "companies":
        navigate("/director/companies");
        break;
      case "drives":
        navigate("/director/drives");
        break;
      case "create-drive":
        navigate("/create-drive");
        break;
      case "applications":
        navigate("/director/applications");
        break;
      case "rounds":
        navigate("/director/rounds");
        break;
      case "shortlists":
        navigate("/director/shortlists");
        break;
      case "profile":
        navigate("/director-profile");
        break;
      default:
        navigate("/director-dashboard");
        break;
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/director-login-page", { replace: true });
  };

  const handleCreateDrive = () => {
    navigate("/create-drive");
  };

  const handleViewDrive = (drive: DashboardDrive) => {
    window.alert(`${drive.companyName}\n${drive.jobRole}\nCTC: ₹${drive.ctc} LPA\nDeadline: ${drive.deadline}`);
  };

  const handleEditDrive = (drive: DashboardDrive) => {
    navigate(`/create-drive?driveId=${drive.id}`);
  };

  return (
    <div className="director-dashboard">
      <DirectorSidebar
        activePage="dashboard"
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="director-dashboard-main">
        <DirectorHeader directorName={director?.name ?? "Placement Director"} />

        <main className="director-dashboard-content">

          {error && <p role="alert">{error}</p>}

          <section className="director-welcome">
            <div>
              <h1>Placement Overview</h1>
              <p>
                Monitor final year placements and ongoing recruitment drives.
              </p>
            </div>

            <button
              type="button"
              className="create-drive-button"
              onClick={handleCreateDrive}
            >
              Create Drive
            </button>
          </section>

          <section className="director-summary">
            <div className="summary-card">
              <span>Final Year Students</span>
              <strong>{finalYearStudents}</strong>
            </div>

            <div className="summary-card">
              <span>Placed Students</span>
              <strong>{placedStudents}</strong>
            </div>

            <div className="summary-card">
              <span>Unplaced Students</span>
              <strong>{unplacedStudents}</strong>
            </div>

            <div className="summary-card">
              <span>Placement Rate</span>
              <strong>{placementRate}%</strong>
            </div>
          </section>

          <section className="director-drives-section">
            <div className="section-header">
              <div>
                <h2>Placement Drives</h2>
                <p>
                  View and manage the drives currently handled by the placement cell.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleNavigation("drives")}
              >
                View All
              </button>
            </div>

            <div className="drive-grid">
              {drives.map((drive) => {
                const registrationPercentage = drive.eligible
                  ? Math.round((drive.registered / drive.eligible) * 100)
                  : 0;

                return (
                  <div className="drive-card" key={drive.id}>

                    <div className="drive-header">
                      <div>
                        <h3>{drive.companyName}</h3>
                        <p>{drive.jobRole}</p>
                      </div>

                      <span className="active-badge">
                        Active
                      </span>
                    </div>

                    <div className="drive-details">
                      <div>
                        <span>CTC</span>
                        <strong>₹{drive.ctc} LPA</strong>
                      </div>

                      <div>
                        <span>Deadline</span>
                        <strong>{drive.deadline}</strong>
                      </div>
                    </div>

                    <div className="registration">
                      <div className="registration-heading">
                        <span>Registration</span>
                        <strong>
                          {drive.registered} / {drive.eligible}
                        </strong>
                      </div>

                      <div className="registration-bar">
                        <div
                          style={{
                            width: `${registrationPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="drive-stats">
                      <div>
                        <strong>{drive.registered}</strong>
                        <span>Registered</span>
                      </div>

                      <div>
                        <strong>{drive.eligible}</strong>
                        <span>Eligible</span>
                      </div>
                    </div>

                    <div className="drive-actions">
                      <button
                        type="button"
                        onClick={() => handleViewDrive(drive)}
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => handleEditDrive(drive)}
                      >
                        Edit Drive
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </section>

          <section className="recent-activity">
            <div className="section-header">
              <div>
                <h2>Recent Activities</h2>
                <p>
                  Recent updates from placement activities.
                </p>
              </div>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <div>
                  <strong>Live placement database connected</strong>
                  <span>All placement statistics and drive data are retrieved live from database.</span>
                </div>
                <span>Current</span>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default DirectorDashboard;