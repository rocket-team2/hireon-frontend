import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  departmentsFromDrive,
  getDrive,
  getActiveDrives,
  getSession,
  getStudentRegistrations,
  registerForDrive,
  clearSession,
  type Drive as ApiDrive,
  type Student,
} from "../../api";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import "./StudentDashboard.css";

interface DashboardDrive {
  id: number;
  company: string;
  role: string;
  ctc: number;
  deadline: string;
  eligibility: boolean;
  registered: boolean;
  departments: string[];
}

function toDashboardDrive(drive: ApiDrive, student: Student, registeredIds: Set<number>): DashboardDrive {
  const departments = departmentsFromDrive(drive.allowed_dept);
  const studentDepartment = (student.department || "").toLowerCase();
  const eligibility = departments.length === 0 || departments.some((department) => (
    department.toLowerCase() === studentDepartment ||
    (studentDepartment.includes("information technology") && department.toLowerCase() === "it")
  ));

  return {
    id: drive.driveId,
    company: drive.company?.c_name ?? "Company",
    role: drive.job_role,
    ctc: drive.ctc_lpa,
    deadline: new Date(drive.deadline).toLocaleDateString(),
    eligibility,
    registered: registeredIds.has(drive.driveId),
    departments,
  };
}

function StudentDashboard() {
  const [drives, setDrives] = useState<DashboardDrive[]>([]);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? session.user as Student : null;
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      navigate("/login-page", { replace: true });
      return;
    }

    const currentStudent = session.user as Student;

    const loadDashboard = async () => {
      try {
        const [activeDrives, registrations] = await Promise.all([
          getActiveDrives(),
          getStudentRegistrations(currentStudent.sId),
        ]);
        const registeredIds = new Set(registrations.map((registration) => registration.drive.driveId));
        setDrives(activeDrives.map((drive) => toDashboardDrive(drive, currentStudent, registeredIds)));
      } catch {
        setError("Unable to load placement drives from database.");
      }
    };

    void loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigation = (page: string) => {
    switch (page) {
      case "dashboard":
        navigate("/student-dashboard");
        break;
      case "drives":
        navigate("/student/drives");
        break;
      case "applications":
        navigate("/student/applications");
        break;
      case "shortlisted":
        navigate("/student/shortlisted");
        break;
      case "skills":
        navigate("/student/skills");
        break;
      case "companies":
        navigate("/student/companies");
        break;
      case "profile":
        navigate("/student-profile");
        break;
      default:
        navigate("/student-dashboard");
        break;
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login-page", { replace: true });
  };

  const handleRegister = async (drive: DashboardDrive) => {
    if (!student) return;

    try {
      await registerForDrive(drive.id, student.sId);
      setDrives((currentDrives) => currentDrives.map((item) => (
        item.id === drive.id ? { ...item, registered: true } : item
      )));
    } catch {
      setError("Registration failed for this drive.");
    }
  };

  const handleViewDetails = (drive: DashboardDrive) => {
  navigate(`/student/drives/${drive.id}`);
};

  return (
    <div className="student-dashboard">
      <StudentSidebar
        activePage="dashboard"
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="student-dashboard-main">
        <StudentHeader
          studentName={student?.name ?? "Student"}
          department={student?.department ?? ""}
        />

        <main className="student-dashboard-content">
          <section className="student-welcome">
            <div>
              <h1>Welcome back, {student?.name ?? "Student"}</h1>
              <p>
                View placement opportunities and track your applications.
              </p>
            </div>

            <div className="placement-status">
              <span>Placement Status</span>
              <strong>{student?.placement_status ?? "Not Placed"}</strong>
            </div>
          </section>

          {error && <p role="alert">{error}</p>}

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
                      onClick={() => void handleRegister(drive)}
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