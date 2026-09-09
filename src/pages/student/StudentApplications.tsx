import { useEffect, useState } from "react";
import {
  deleteRegistration,
  getSession,
  getStudentRegistrations,
  type Registration,
  type Student,
} from "../../api";
import {
  getPlacedApplications,
  syncPlacedApplicationsWithServer,
  type PlacedApplicationRequest,
} from "../../utils/eligibility";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentApplications.css";

function StudentApplications() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [placedRequests, setPlacedRequests] = useState<PlacedApplicationRequest[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  useEffect(() => {
    if (!student) return;

    const loadReqs = async () => {
      try {
        const synced = await syncPlacedApplicationsWithServer();
        setPlacedRequests(synced.filter((r) => r.studentId === student.sId));
      } catch {
        const all = getPlacedApplications();
        setPlacedRequests(all.filter((r) => r.studentId === student.sId));
      }
    };

    void loadReqs();

    void getStudentRegistrations(student.sId)
      .then((data) => setRegistrations(data))
      .catch(() => setError("Unable to load your registered drives from database."))
      .finally(() => setIsLoading(false));

    const handleSync = () => {
      const all = getPlacedApplications();
      setPlacedRequests(all.filter((r) => r.studentId === student.sId));
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("placed_apps_synced", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("placed_apps_synced", handleSync);
    };
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

  // Pending or rejected requests that are not yet in registrations
  const registeredDriveIds = new Set(registrations.map((r) => r.drive.driveId));
  const pendingOrRejectedRequests = placedRequests.filter(
    (req) => !registeredDriveIds.has(req.driveId)
  );

  const hasAnyApplications =
    registrations.length > 0 || pendingOrRejectedRequests.length > 0;

  return (
    <StudentPageLayout activePage="applications" title="My Applications">
      <div className="applications-page">
        {error && (
          <p className="profile-saved-message" role="alert">
            {error}
          </p>
        )}

        {isLoading ? (
          <p>Loading applications from database...</p>
        ) : !hasAnyApplications ? (
          <div className="empty-applications">
            <p>You have not registered for any placement drives yet.</p>
          </div>
        ) : (
          <div className="applications-list">
            {/* Placed student approval requests (Pending / Denied) */}
            {pendingOrRejectedRequests.map((req) => (
              <div
                key={req.id}
                className={`application-card ${
                  req.status === "REJECTED" ? "card-rejected" : "card-pending"
                }`}
              >
                <div className="app-details">
                  <h3>{req.companyName}</h3>
                  <p>
                    <strong>Drive:</strong> {req.driveTitle}
                  </p>
                  <p>
                    <strong>Requested on:</strong> {req.requestedAt}
                  </p>
                  {req.status === "PENDING" ? (
                    <p style={{ color: "#d97706", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      ⏳ Placed student application submitted. Awaiting Placement Director approval.
                    </p>
                  ) : (
                    <p style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      ✕ Registration request was not approved by the Placement Director.
                    </p>
                  )}
                </div>

                <div className="app-meta">
                  {req.status === "PENDING" ? (
                    <span className="app-badge badge-pending">
                      ⏳ Director Approval Pending
                    </span>
                  ) : (
                    <span className="app-badge badge-rejected">
                      ✕ Denied by Director
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Confirmed registrations */}
            {registrations.map((reg) => (
              <div key={reg.drId ?? reg.drive.driveId} className="application-card">
                <div className="app-details">
                  <h3>{reg.drive.company?.c_name ?? "Company"}</h3>
                  <p>
                    <strong>Role:</strong> {reg.drive.job_role} |{" "}
                    <strong>CTC:</strong> ₹{reg.drive.ctc_lpa} LPA
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {new Date(reg.drive.deadline).toLocaleDateString()}
                  </p>
                </div>

                <div className="app-meta">
                  <span className="app-badge">✓ Registered</span>
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
