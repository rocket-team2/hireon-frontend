import { useEffect, useState } from "react";
import {
  deleteRegistration,
  getSession,
  getStudentRegistrations,
  type Registration,
  type Student,
} from "../../api";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentApplications.css";

function StudentApplications() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  useEffect(() => {
    if (!student) return;

    void getStudentRegistrations(student.sId)
      .then((data) => setRegistrations(data))
      .catch(() => setError("Unable to load your registered drives from database."))
      .finally(() => setIsLoading(false));
  }, [student]);

  const handleWithdraw = async (driveId: number) => {
    if (!student) return;

    try {
      await deleteRegistration(driveId, student.sId);
      setRegistrations((prev) => prev.filter((r) => r.drive.driveId !== driveId));
    } catch {
      setError("Unable to cancel registration. Please try again.");
    }
  };

  return (
    <StudentPageLayout activePage="applications" title="My Applications">
      <div className="applications-page">

        {error && <p className="profile-saved-message" role="alert">{error}</p>}

        {isLoading ? (
          <p>Loading applications from database...</p>
        ) : registrations.length === 0 ? (
          <div className="empty-applications">
            <p>You have not registered for any placement drives yet.</p>
          </div>
        ) : (
          <div className="applications-list">
            {registrations.map((reg) => (
              <div key={reg.drId ?? reg.drive.driveId} className="application-card">
                <div className="app-details">
                  <h3>{reg.drive.company?.c_name ?? "Company"}</h3>
                  <p>
                    <strong>Role:</strong> {reg.drive.job_role} | <strong>CTC:</strong> ₹{reg.drive.ctc_lpa} LPA
                  </p>
                  <p>
                    <strong>Deadline:</strong> {new Date(reg.drive.deadline).toLocaleDateString()}
                  </p>
                </div>

                <div className="app-meta">
                  <span className="app-badge">Registered</span>
                  <button
                    type="button"
                    className="withdraw-button"
                    onClick={() => void handleWithdraw(reg.drive.driveId)}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentPageLayout>
  );
}

export default StudentApplications;
