import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import "./StudentDashboard.css";

interface Drive {
  id: number;
  company: string;
  role: string;
  ctc: number;
  deadline: string;
  eligibility: boolean;
  registered: boolean;
  departments: string[];
}

const initialDrives: Drive[] = [
  {
    id: 1,
    company: "TCS",
    role: "Software Engineer",
    ctc: 7.5,
    deadline: "15 Sep 2026",
    eligibility: true,
    registered: false,
    departments: ["IT", "CSE", "ECE"],
  },
  {
    id: 2,
    company: "Infosys",
    role: "Systems Engineer",
    ctc: 6.5,
    deadline: "20 Sep 2026",
    eligibility: true,
    registered: true,
    departments: ["IT", "CSE", "ECE", "EEE"],
  },
  {
    id: 3,
    company: "Wipro",
    role: "Project Engineer",
    ctc: 5.5,
    deadline: "10 Sep 2026",
    eligibility: false,
    registered: false,
    departments: ["IT", "CSE"],
  },
  {
    id: 4,
    company: "Accenture",
    role: "Associate Software Engineer",
    ctc: 6,
    deadline: "25 Sep 2026",
    eligibility: true,
    registered: false,
    departments: ["IT", "CSE"],
  },
];

function getDrives(): Drive[] {
  const savedDrives = localStorage.getItem("directorDrives");
  const createdDrives = savedDrives ? JSON.parse(savedDrives) : [];

  return [
    ...initialDrives,
    ...createdDrives.map((drive: { id: number; company: string; jobRole: string; ctc: number; deadline: string; departments: string[] }) => ({
      id: drive.id,
      company: drive.company,
      role: drive.jobRole,
      ctc: drive.ctc,
      deadline: drive.deadline,
      eligibility: drive.departments.includes("IT"),
      registered: false,
      departments: drive.departments,
    })),
  ];
}

function StudentDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [drives] = useState<Drive[]>(getDrives);
  const navigate = useNavigate();

  const studentName = "Thejashree";
  const department = "Information Technology";

  const handleNavigation = (page: string) => {
    if (page === "profile") {
      navigate("/student-profile");
      return;
    }

    if (page === "skills") {
      navigate("/student-profile#skills");
      return;
    }

    setActivePage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem("hireon.role");
    navigate("/login-page", { replace: true });
  };

  const handleRegister = (drive: Drive) => {
    console.log("Registering for:", drive.company);
  };

  const handleViewDetails = (drive: Drive) => {
    console.log("Viewing:", drive.company);
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="student-dashboard-main">
        <StudentHeader
          studentName={studentName}
          department={department}
        />

        <main className="student-dashboard-content">
          <section className="student-welcome">
            <div>
              <h1>Welcome back, {studentName}</h1>
              <p>
                View placement opportunities and track your applications.
              </p>
            </div>

            <div className="placement-status">
              <span>Placement Status</span>
              <strong>Not Placed</strong>
            </div>
          </section>

          <section className="drive-section">
            <div className="section-heading">
              <div>
                <h2>Placement Drives</h2>
                <p>
                  Drives available through the placement cell.
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
              {drives.map((drive) => (
                <div
                  key={drive.id}
                  className={`drive-card ${
                    !drive.eligibility ? "not-eligible" : ""
                  }`}
                >
                  <div className="drive-card-top">
                    <div>
                      <h3>{drive.company}</h3>
                      <p>{drive.role}</p>
                    </div>

                    <span
                      className={
                        drive.eligibility
                          ? "eligible-status"
                          : "ineligible-status"
                      }
                    >
                      {drive.eligibility
                        ? "Eligible"
                        : "Not Eligible"}
                    </span>
                  </div>

                  <div className="drive-info">
                    <div>
                      <span>CTC</span>
                      <strong>₹{drive.ctc} LPA</strong>
                    </div>

                    <div>
                      <span>Deadline</span>
                      <strong>{drive.deadline}</strong>
                    </div>
                  </div>

                  <div className="drive-departments">
                    {drive.departments.join(" · ")}
                  </div>

                  <div className="drive-actions">
                    <button
                      type="button"
                      className="details-button"
                      onClick={() => handleViewDetails(drive)}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="register-button"
                      disabled={
                        !drive.eligibility || drive.registered
                      }
                      onClick={() => handleRegister(drive)}
                    >
                      {drive.registered
                        ? "Registered"
                        : drive.eligibility
                          ? "Register"
                          : "Not Eligible"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;