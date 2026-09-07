import { useEffect, useState } from "react";
import {
  departmentsFromDrive,
  getActiveDrives,
  getSession,
  getStudentRegistrations,
  registerForDrive,
  type Drive as ApiDrive,
  type Student,
} from "../../api";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentDashboard.css";
import "./StudentDrives.css";

interface DisplayDrive {
  id: number;
  company: string;
  role: string;
  ctc: number;
  deadline: string;
  eligibility: boolean;
  registered: boolean;
  departments: string[];
}

function StudentDrives() {
  const [drives, setDrives] = useState<DisplayDrive[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  useEffect(() => {
    if (!student) return;

    const loadDrives = async () => {
      try {
        const [activeDrives, registrations] = await Promise.all([
          getActiveDrives(),
          getStudentRegistrations(student.sId),
        ]);
        const registeredIds = new Set(registrations.map((r) => r.drive.driveId));

        const studentDepartment = student.department.toLowerCase();
        const mapped = activeDrives.map((drive: ApiDrive) => {
          const depts = departmentsFromDrive(drive.allowed_dept);
          const eligibility =
            depts.length === 0 ||
            depts.some(
              (dept) =>
                dept.toLowerCase() === studentDepartment ||
                (studentDepartment.includes("information technology") && dept.toLowerCase() === "it")
            );

          return {
            id: drive.driveId,
            company: drive.company?.c_name ?? "Company",
            role: drive.job_role,
            ctc: drive.ctc_lpa,
            deadline: new Date(drive.deadline).toLocaleDateString(),
            eligibility,
            registered: registeredIds.has(drive.driveId),
            departments: depts,
          };
        });

        setDrives(mapped);
      } catch {
        setError("Unable to fetch placement drives from the database.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDrives();
  }, [student]);

  const handleRegister = async (drive: DisplayDrive) => {
    if (!student) return;

    try {
      await registerForDrive(drive.id, student.sId);
      setDrives((prev) =>
        prev.map((item) => (item.id === drive.id ? { ...item, registered: true } : item))
      );
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StudentPageLayout activePage="drives" title="Placement Drives">
      <div className="student-drives-page">

        {error && <p className="profile-saved-message" role="alert">{error}</p>}

        <div className="drives-search-bar">
          <input
            type="text"
            placeholder="Search by company or job role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p>Loading placement drives from database...</p>
        ) : (
          <div className="drive-grid-container">
            {filteredDrives.length === 0 ? (
              <div className="empty-drives">
                <p>No placement drives found.</p>
              </div>
            ) : (
              filteredDrives.map((drive) => (
                <div
                  key={drive.id}
                  className={`drive-card ${!drive.eligibility ? "not-eligible" : ""}`}
                >
                  <div className="drive-card-top">
                    <div>
                      <h3>{drive.company}</h3>
                      <p>{drive.role}</p>
                    </div>

                    <span className={drive.eligibility ? "eligible-status" : "ineligible-status"}>
                      {drive.eligibility ? "Eligible" : "Not Eligible"}
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
                    {drive.departments.length > 0 ? drive.departments.join(" · ") : "All Departments"}
                  </div>

                  <div className="drive-actions">
                    <button
                      type="button"
                      className="details-button"
                      onClick={() =>
                        alert(
                          `${drive.company}\nRole: ${drive.role}\nCTC: ₹${drive.ctc} LPA\nDeadline: ${drive.deadline}`
                        )
                      }
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="register-button"
                      disabled={!drive.eligibility || drive.registered}
                      onClick={() => void handleRegister(drive)}
                    >
                      {drive.registered ? "Registered" : drive.eligibility ? "Register" : "Not Eligible"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </StudentPageLayout>
  );
}

export default StudentDrives;
