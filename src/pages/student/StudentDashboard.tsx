import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getActiveDrives,
  getSession,
  getStudentRegistrations,
  registerForDrive,
  clearSession,
  type Drive as ApiDrive,
  type Student,
} from "../../api";
import {
  calculateEligibility,
  getCompanyLogoUrl,
  getPlacedApplications,
  savePlacedApplicationRequest,
  syncPlacedApplicationsWithServer,
  type EligibilityResult,
  type PlacedApplicationRequest,
} from "../../utils/eligibility";
import CompanyLogo from "../../components/CompanyLogo";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import "./StudentDashboard.css";

interface DashboardDrive {
  apiDrive: ApiDrive;
  id: number;
  company: string;
  companyLogoUrl: string;
  compUrl?: string;
  role: string;
  ctc: number;
  deadline: string;
  eligibilityResult: EligibilityResult;
  registered: boolean;
  departments: string[];
}

function StudentDashboard() {
  const [drives, setDrives] = useState<DashboardDrive[]>([]);
  const [student, setStudent] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });
  const [error, setError] = useState("");
  const [placedPopupDrive, setPlacedPopupDrive] = useState<DashboardDrive | null>(null);
  const [placedSuccessMsg, setPlacedSuccessMsg] = useState("");
  const [placedRequests, setPlacedRequests] = useState<PlacedApplicationRequest[]>([]);
  const navigate = useNavigate();

  const [showAllDrives, setShowAllDrives] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      navigate("/login-page", { replace: true });
      return;
    }

    const currentStudent = session.user as Student;
    setStudent(currentStudent);

    const loadDashboard = async () => {
      try {
        const [activeDrives, registrations] = await Promise.all([
          getActiveDrives(),
          getStudentRegistrations(currentStudent.sId),
        ]);
        const registeredIds = new Set(registrations.map((r) => r.drive.driveId));

        const mapped: DashboardDrive[] = activeDrives.map((drive) => {
          const eligResult = calculateEligibility(currentStudent, drive);
          const logoUrl = getCompanyLogoUrl(drive.company?.c_name ?? "", drive.company?.comp_url);
          const depts = Array.isArray(drive.allowed_dept)
            ? (drive.allowed_dept as string[])
            : drive.allowed_dept && typeof drive.allowed_dept === "object"
            ? Object.values(drive.allowed_dept as Record<string, string>)
            : [];

          return {
            apiDrive: drive,
            id: drive.driveId,
            company: drive.company?.c_name ?? "Company",
            companyLogoUrl: logoUrl,
            compUrl: drive.company?.comp_url,
            role: drive.job_role,
            ctc: drive.ctc_lpa,
            deadline: new Date(drive.deadline).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            eligibilityResult: eligResult,
            registered: registeredIds.has(drive.driveId),
            departments: depts,
          };
        });

        // Requirement: Order on eligibility first, then deadline
        mapped.sort((a, b) => {
          if (a.eligibilityResult.isEligible !== b.eligibilityResult.isEligible) {
            return a.eligibilityResult.isEligible ? -1 : 1;
          }
          const timeA = new Date(a.apiDrive.deadline).getTime() || 0;
          const timeB = new Date(b.apiDrive.deadline).getTime() || 0;
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return b.eligibilityResult.score - a.eligibilityResult.score;
        });

        setDrives(mapped);
        try {
          const synced = await syncPlacedApplicationsWithServer();
          setPlacedRequests(synced);
        } catch {
          setPlacedRequests(getPlacedApplications());
        }
      } catch {
        setError("Unable to load drives. Please refresh the page.");
      }
    };

    void loadDashboard();

    const handleSync = () => {
      setPlacedRequests(getPlacedApplications());
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("placed_apps_synced", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("placed_apps_synced", handleSync);
    };
  }, [navigate]);

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

  const handleRegisterClick = (drive: DashboardDrive) => {
    if (!student) return;

    // Placed student requires Director approval before registration
    const isPlaced = student.placement_status === "Placed" || Boolean(student.company);
    if (isPlaced) {
      const existingReq = placedRequests.find((r) => r.driveId === drive.id && r.studentId === student.sId);
      if (existingReq?.status === "PENDING" || existingReq?.status === "REJECTED" || drive.registered) {
        return;
      }
      setPlacedPopupDrive(drive);
      return;
    }

    // Unplaced student: directly register for drive
    void executeRegister(drive);
  };

  const executeRegister = async (drive: DashboardDrive) => {
    if (!student) return;
    try {
      await registerForDrive(drive.id, student.sId);
      setDrives((currentDrives) =>
        currentDrives.map((item) =>
          item.id === drive.id ? { ...item, registered: true } : item
        )
      );
    } catch {
      setError("Registration failed for this drive.");
    }
  };

  const handleConfirmPlacedApplication = () => {
    if (!placedPopupDrive || !student) return;
    savePlacedApplicationRequest(placedPopupDrive.apiDrive, student);
    setPlacedRequests(getPlacedApplications());
    setPlacedSuccessMsg(`Approval request for ${placedPopupDrive.company} submitted to Placement Director! Once approved, your registration will be activated.`);
    setPlacedPopupDrive(null);
  };

  const handleViewDetails = (drive: DashboardDrive) => {
    navigate(`/student/drives/${drive.id}`);
  };

  const isStudentPlaced = student?.placement_status === "Placed" || Boolean(student?.company);

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
          placementStatus={student?.placement_status}
          companyName={student?.company?.c_name}
        />

        <main className="student-dashboard-content">
          {/* Welcome Banner */}
          <section className="student-welcome">
            <div>
              <h1>Welcome back, {student?.name ?? "Student"}! 👋</h1>
              <p>
                Track campus recruitment drives, eligibility metrics, and placement status.
              </p>
            </div>

            <div
              className={`placement-status ${
                isStudentPlaced ? "badge-success" : "badge-process"
              }`}
              style={{ padding: "10px 18px", borderRadius: "12px", border: "1px solid" }}
            >
              <span>Placement Status</span>
              <strong style={{ fontSize: "1.1rem", display: "block" }}>
                {isStudentPlaced
                  ? `Placed @ ${student?.company?.c_name ?? "Company"}`
                  : "In Progress / Seeking"}
              </strong>
            </div>
          </section>

          {placedSuccessMsg && (
            <div className="alert-success-box" role="status">
              ✓ {placedSuccessMsg}
            </div>
          )}

          {error && <div className="alert-danger-box" role="alert">{error}</div>}

          <section className="drive-section">
            <div className="section-heading">
              <div>
                <h2>Active Placement Drives</h2>
                <p>Opportunities matching your profile and campus drives.</p>
              </div>

              <button
                type="button"
                className="view-all-btn"
                onClick={() => handleNavigation("drives")}
              >
                View All Drives →
              </button>
            </div>

            <div className="drive-grid">
              {(showAllDrives ? drives : drives.slice(0, 6)).map((drive) => {
                const { score, isEligible, reasons } = drive.eligibilityResult;

                return (
                  <div
                    key={drive.id}
                    className={`drive-card ${!isEligible ? "not-eligible" : ""}`}
                  >
                    <div className="drive-card-top">
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <CompanyLogo companyName={drive.company} companyUrl={drive.compUrl} size={48} />
                        <div>
                          <h3>{drive.company}</h3>
                          <p>{drive.role}</p>
                        </div>
                      </div>

                      {/* Requirement 2: Eligibility Score */}
                      <div style={{ textAlign: "right" }}>
                        <span
                          className={
                            isEligible
                              ? score >= 75
                                ? "badge-success"
                                : "badge-process"
                              : "badge-danger"
                          }
                        >
                          {isEligible ? `Score: ${score}%` : "Not Eligible"}
                        </span>
                      </div>
                    </div>

                    <div className="drive-info">
                      <div>
                        <span>Package (CTC)</span>
                        <strong>₹{drive.ctc} LPA</strong>
                      </div>

                      <div>
                        <span>Deadline</span>
                        <strong>{drive.deadline}</strong>
                      </div>
                    </div>

                    <div className="drive-departments">
                      Allowed: {drive.departments.length > 0 ? drive.departments.join(" · ") : "All Departments"}
                    </div>

                    {/* Requirement 3: Explicit Ineligible Reasons */}
                    {!isEligible && reasons.length > 0 && (
                      <div className="alert-danger-box" style={{ fontSize: "0.82rem", margin: "8px 0" }}>
                        <strong>Ineligible Reasons:</strong>
                        <ul style={{ margin: "4px 0 0 16px" }}>
                          {reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="drive-actions">
                      <button
                        type="button"
                        className="details-button"
                        onClick={() => handleViewDetails(drive)}
                      >
                        View Details
                      </button>

                      {/* Requirement 9: Register Button */}
                      {(() => {
                        const drivePlacedReq = isStudentPlaced
                          ? placedRequests.find((r) => r.driveId === drive.id && r.studentId === student?.sId)
                          : null;

                        return (
                          <button
                            type="button"
                            className={`register-button ${
                              drive.registered || drivePlacedReq?.status === "APPROVED"
                                ? "registered"
                                : isStudentPlaced && drivePlacedReq?.status === "PENDING"
                                ? "pending-approval"
                                : isStudentPlaced && drivePlacedReq?.status === "REJECTED"
                                ? "rejected-approval"
                                : isStudentPlaced
                                ? "request-approval"
                                : isEligible
                                ? "eligible"
                                : "disabled"
                            }`}
                            disabled={
                              !isEligible ||
                              drive.registered ||
                              drivePlacedReq?.status === "APPROVED" ||
                              (isStudentPlaced && (drivePlacedReq?.status === "PENDING" || drivePlacedReq?.status === "REJECTED"))
                            }
                            onClick={() => handleRegisterClick(drive)}
                          >
                            {drive.registered || drivePlacedReq?.status === "APPROVED"
                              ? "✓ Registered"
                              : !isEligible
                              ? "Not Eligible"
                              : isStudentPlaced
                              ? drivePlacedReq?.status === "PENDING"
                                ? "⏳ Approval Pending"
                                : drivePlacedReq?.status === "REJECTED"
                                ? "✕ Rejected by Director"
                                : "Request Approval"
                              : "Register Now"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

            {drives.length > 6 && (
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                  type="button"
                  className="badge-process"
                  style={{
                    padding: "12px 28px",
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    borderRadius: "12px",
                    border: "1px solid #A6CEF7",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                  }}
                  onClick={() => setShowAllDrives((prev) => !prev)}
                >
                  {showAllDrives ? "Show Less Drives ↑" : `Show More Drives (${drives.length - 6} More) ↓`}
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Requirement 7: Placed Student Popup Modal */}
      {placedPopupDrive && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ color: "#993C1D" }}>⚠️ Placed Student Application Confirmation</h3>
              <button
                type="button"
                onClick={() => setPlacedPopupDrive(null)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="alert-process-box">
              <p>
                You are currently placed at <strong>{student?.company?.c_name ?? "your company"}</strong>.
              </p>
              <p style={{ marginTop: "8px" }}>
                Under institution placement policy, applying for an additional drive (<strong>{placedPopupDrive.company} - {placedPopupDrive.role}</strong>) requires explicit approval from the Placement Director.
              </p>
            </div>

            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#64748B" }}>
              Would you like to send an official application request to the Placement Director for review?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setPlacedPopupDrive(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: "#F1F5F9",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlacedApplication}
                className="badge-success"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                Submit Request to Director
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;