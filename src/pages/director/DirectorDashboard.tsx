import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectorSidebar from "./components/DirectorSidebar";
import DirectorHeader from "./components/DirectorHeader";
import "./DirectorDashboard.css";

interface Drive {
  id: number;
  companyName: string;
  jobRole: string;
  ctc: number;
  deadline: string;
  registered: number;
  eligible: number;
  shortlisted: number;
}

interface CreatedDrive {
  id: number;
  company: string;
  jobRole: string;
  ctc: number;
  deadline: string;
}

const initialDrives: Drive[] = [
  {
    id: 1,
    companyName: "TCS",
    jobRole: "Software Engineer",
    ctc: 7.5,
    deadline: "15 Sep 2026",
    registered: 124,
    eligible: 160,
    shortlisted: 32,
  },
  {
    id: 2,
    companyName: "Infosys",
    jobRole: "Systems Engineer",
    ctc: 6.5,
    deadline: "20 Sep 2026",
    registered: 98,
    eligible: 142,
    shortlisted: 24,
  },
  {
    id: 3,
    companyName: "Wipro",
    jobRole: "Project Engineer",
    ctc: 5.5,
    deadline: "10 Sep 2026",
    registered: 116,
    eligible: 135,
    shortlisted: 40,
  },
  {
    id: 4,
    companyName: "Accenture",
    jobRole: "Associate Software Engineer",
    ctc: 6,
    deadline: "25 Sep 2026",
    registered: 105,
    eligible: 120,
    shortlisted: 28,
  },
];

function getDrives(): Drive[] {
  const savedDrives = localStorage.getItem("directorDrives");
  const createdDrives = savedDrives ? JSON.parse(savedDrives) : [];

  return [
    ...initialDrives,
    ...createdDrives.map((drive: CreatedDrive) => ({
      ...drive,
      companyName: drive.company,
      registered: 0,
      eligible: 0,
      shortlisted: 0,
    })),
  ];
}

function DirectorDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [drives] = useState<Drive[]>(getDrives);
  const navigate = useNavigate();

  const finalYearStudents = 420;
  const placedStudents = 286;
  const unplacedStudents =
    finalYearStudents - placedStudents;

  const placementRate =
    ((placedStudents / finalYearStudents) * 100).toFixed(1);

  const handleNavigation = (page: string) => {
    if (page === "profile") {
      navigate("/director-profile");
      return;
    }

    if (page === "create-drive") {
      navigate("/create-drive");
      return;
    }

    setActivePage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem("hireon.role");
    navigate("/director-login-page", { replace: true });
  };

  const handleCreateDrive = () => {
    navigate("/create-drive");
  };

  const handleViewDrive = (drive: Drive) => {
    console.log("View drive:", drive.id);
  };

  const handleEditDrive = (drive: Drive) => {
    console.log("Edit drive:", drive.id);
  };

  return (
    <div className="director-dashboard">
      <DirectorSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="director-dashboard-main">
        <DirectorHeader directorName="Placement Director" />

        <main className="director-dashboard-content">

          <section className="director-welcome">
            <div>
              <h1>Placement Overview</h1>
              <p>
                Monitor final year placements and ongoing
                recruitment drives.
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
                  View and manage the drives currently handled
                  by the placement cell.
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
                  <strong>
                    TCS - Round 2 shortlist uploaded
                  </strong>
                  <span>
                    32 students shortlisted
                  </span>
                </div>

                <span>2 hours ago</span>
              </div>

              <div className="activity-item">
                <div>
                  <strong>
                    Infosys registration updated
                  </strong>
                  <span>
                    98 students registered
                  </span>
                </div>

                <span>5 hours ago</span>
              </div>

              <div className="activity-item">
                <div>
                  <strong>
                    Wipro Round 1 completed
                  </strong>
                  <span>
                    Shortlisting is pending
                  </span>
                </div>

                <span>Yesterday</span>
              </div>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default DirectorDashboard;