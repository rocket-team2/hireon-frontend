import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearSession,
  getAllDrives,
  getDriveRegistrations,
  getSession,
  getStudents,
  type Drive as ApiDrive,
  type Director,
  type Student,
} from "../../api";
import {
  calculateEligibility,
  getCompanyLogoUrl,
  getPlacedApplications,
  getAllInterviewFeedback,
  type PlacedApplicationRequest,
  type StudentInterviewFeedback,
} from "../../utils/eligibility";
import CompanyLogo from "../../components/CompanyLogo";
import DirectorSidebar from "./components/DirectorSidebar";
import DirectorHeader from "./components/DirectorHeader";
import "./DirectorDashboard.css";

interface DashboardDrive {
  id: number;
  companyName: string;
  logoUrl: string;
  compUrl?: string;
  jobRole: string;
  ctc: number;
  deadline: string;
  registered: number;
  eligible: number;
  shortlisted: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: "PLACED_REQUEST" | "REGISTRATION" | "FEEDBACK" | "DRIVE";
}

function DirectorDashboard() {
  const [drives, setDrives] = useState<DashboardDrive[]>([]);
  const [, setStudents] = useState<Student[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [placedStudentCount, setPlacedStudentCount] = useState(0);
  const [placedRequests, setPlacedRequests] = useState<PlacedApplicationRequest[]>([]);
  const [, setFeedbacks] = useState<StudentInterviewFeedback[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [director] = useState<Director | null>(() => {
    const session = getSession();
    return session?.role === "director" ? (session.user as Director) : null;
  });
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setIsRefreshing(true);
      setError("");

      const [apiDrives, allStudents] = await Promise.all([getAllDrives(), getStudents()]);
      setStudents(allStudents);
      setStudentCount(allStudents.length);
      
      const placedCount = allStudents.filter(
        (st) => st.placement_status?.toLowerCase() === "placed" || Boolean(st.company)
      ).length;
      setPlacedStudentCount(placedCount);

      // Load live placed student requests & feedback links
      const liveRequests = getPlacedApplications();
      setPlacedRequests(liveRequests);

      const liveFeedbacks = getAllInterviewFeedback();
      setFeedbacks(liveFeedbacks);

      // Fetch drive registrations live in parallel
      const allRegistrations = await Promise.all(
        apiDrives.map((d: ApiDrive) => getDriveRegistrations(d.driveId).catch(() => []))
      );

      const dashboardDrives: DashboardDrive[] = apiDrives.map((drive: ApiDrive, index: number) => {
        const regs = allRegistrations[index];
        // Calculate eligible student count dynamically across all students
        const eligibleCount = allStudents.filter(
          (st) => calculateEligibility(st, drive).isEligible
        ).length;

        const logoUrl = getCompanyLogoUrl(drive.company?.c_name ?? "", drive.company?.comp_url);

        return {
          id: drive.driveId,
          companyName: drive.company?.c_name ?? "Company",
          logoUrl,
          compUrl: drive.company?.comp_url,
          jobRole: drive.job_role,
          ctc: drive.ctc_lpa,
          deadline: new Date(drive.deadline).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          registered: regs.length,
          eligible: eligibleCount || allStudents.length,
          shortlisted: 0,
        };
      });

      setDrives(dashboardDrives);

      // Construct Live Recent Activity Stream
      const liveActivities: ActivityItem[] = [];

      // 1. Placed Student Approval Requests
      liveRequests.forEach((req) => {
        liveActivities.push({
          id: `req_${req.id}`,
          title: `Placed Student Request: ${req.studentName} (${req.status})`,
          subtitle: `Placed @ ${req.placedCompany} → Requesting to apply for ${req.companyName} (${req.driveTitle})`,
          timestamp: req.requestedAt,
          type: "PLACED_REQUEST",
        });
      });

      // 2. Interview Feedbacks Added
      liveFeedbacks.forEach((fb) => {
        liveActivities.push({
          id: `fb_${fb.studentId}_${fb.companyId}`,
          title: `Interview Feedback Added: ${fb.studentName}`,
          subtitle: `Feedback link recorded for ${fb.companyName}: ${fb.feedbackUrl}`,
          timestamp: fb.updatedAt,
          type: "FEEDBACK",
        });
      });

      // 3. Active Drives Summary Activity
      apiDrives.slice(0, 3).forEach((drive) => {
        liveActivities.push({
          id: `drive_${drive.driveId}`,
          title: `Active Drive: ${drive.company?.c_name ?? "Company"} - ${drive.job_role}`,
          subtitle: `Package: ₹${drive.ctc_lpa} LPA | Application Deadline: ${new Date(drive.deadline).toLocaleDateString("en-IN")}`,
          timestamp: "Active",
          type: "DRIVE",
        });
      });

      setActivities(liveActivities);
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch {
      setError("Unable to load live placement tracking data from database.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load + 10-second Real-time Polling Interval
  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "director") {
      navigate("/director-login-page", { replace: true });
      return;
    }

    void loadDashboard();

    const intervalId = setInterval(() => {
      void loadDashboard();
    }, 10000); // Poll live database stats every 10 seconds

    return () => clearInterval(intervalId);
  }, [navigate]);

  const finalYearStudents = studentCount;
  const placedStudents = placedStudentCount;
  const unplacedStudents = Math.max(0, finalYearStudents - placedStudents);
  const pendingApprovalCount = placedRequests.filter((r) => r.status === "PENDING").length;

  const placementRate =
    finalYearStudents > 0 ? ((placedStudents / finalYearStudents) * 100).toFixed(1) : "0.0";

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

  return (
    <div className="director-dashboard">
      <DirectorSidebar activePage="dashboard" onNavigate={handleNavigation} onLogout={handleLogout} />

      <div className="director-dashboard-main">
        <DirectorHeader directorName={director?.name ?? "Placement Director"} />

        <main className="director-dashboard-content">
          {/* Live Tracking Header Bar */}
          <section
            className="director-welcome"
            style={{
              background: "linear-gradient(135deg, #172554, #1E3A8A)",
              color: "#ffffff",
              padding: "24px 28px",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(23, 37, 84, 0.2)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                    boxShadow: "0 0 10px #10B981",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.5px", color: "#10B981" }}>
                  REAL-TIME PLACEMENT TRACKING ACTIVE
                </span>
                {lastUpdated && (
                  <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                    (Last synced: {lastUpdated})
                  </span>
                )}
              </div>
              <h1 style={{ color: "#ffffff", margin: "0 0 4px", fontSize: "1.75rem", fontWeight: "800" }}>
                Placement Control Center
              </h1>
              <p style={{ color: "#CBD5E1", margin: 0, fontSize: "0.95rem" }}>
                Live stats, candidate eligibility scores, and authority approval queues.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="badge-process"
                onClick={() => void loadDashboard()}
                style={{ padding: "10px 16px", cursor: "pointer", border: "1px solid #A6CEF7" }}
              >
                {isRefreshing ? "Refreshing..." : "🔄 Sync Live Data"}
              </button>

              <button
                type="button"
                className="create-drive-button"
                onClick={() => navigate("/create-drive")}
                style={{ background: "#4F46E5", padding: "10px 18px", borderRadius: "8px", fontWeight: "700" }}
              >
                + Create New Drive
              </button>
            </div>
          </section>

          {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

          {/* Key Placement Metrics Grid */}
          <section className="director-summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", margin: "24px 0 32px", border: "none", background: "transparent" }}>
            <div className="summary-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ color: "#64748B", fontSize: "0.85rem", fontWeight: "600" }}>TOTAL CANDIDATES</span>
              <strong style={{ color: "#0F172A", fontSize: "2rem", display: "block", marginTop: "4px" }}>
                {finalYearStudents}
              </strong>
            </div>

            <div className="summary-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid #C3E2A0", background: "#EAF3DE", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ color: "#3B6D11", fontSize: "0.85rem", fontWeight: "700" }}>CONFIRMED PLACEMENTS</span>
              <strong style={{ color: "#3B6D11", fontSize: "2rem", display: "block", marginTop: "4px" }}>
                {placedStudents}
              </strong>
            </div>

            <div className="summary-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ color: "#64748B", fontSize: "0.85rem", fontWeight: "600" }}>UNPLACED CANDIDATES</span>
              <strong style={{ color: "#0F172A", fontSize: "2rem", display: "block", marginTop: "4px" }}>
                {unplacedStudents}
              </strong>
            </div>

            <div className="summary-card" style={{ padding: "20px", borderRadius: "14px", border: "1px solid #A6CEF7", background: "#E6F1FB", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
              <span style={{ color: "#042C53", fontSize: "0.85rem", fontWeight: "700" }}>OVERALL PLACEMENT RATE</span>
              <strong style={{ color: "#042C53", fontSize: "2rem", display: "block", marginTop: "4px" }}>
                {placementRate}%
              </strong>
            </div>
          </section>

          {/* Pending Placed Student Approval Alert Banner */}
          {pendingApprovalCount > 0 && (
            <section
              className="alert-warning-box"
              style={{
                marginBottom: "2rem",
                padding: "18px 24px",
                borderRadius: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "1.05rem" }}>
                  ⚠️ {pendingApprovalCount} Placed Student Application Request{pendingApprovalCount !== 1 ? "s" : ""} Awaiting Director Approval
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                  Students already placed in a company have requested authority authorization to apply for new drives.
                </p>
              </div>
              <button
                type="button"
                className="badge-warning"
                style={{ padding: "8px 16px", cursor: "pointer", fontSize: "0.9rem" }}
                onClick={() => navigate("/director/applications")}
              >
                Review Approval Requests →
              </button>
            </section>
          )}

          {/* Live Placement Drives Grid */}
          <section className="director-drives-section">
            <div className="section-header">
              <div>
                <h2>Live Placement Drives & Registration Uptake</h2>
                <p>Real-time application metrics across active recruitment drives.</p>
              </div>

              <button type="button" onClick={() => handleNavigation("drives")}>
                View All Drives →
              </button>
            </div>

            {isLoading ? (
              <p>Loading live drives from database...</p>
            ) : (
              <div className="drive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {drives.map((drive) => {
                  const registrationPercentage = drive.eligible
                    ? Math.min(100, Math.round((drive.registered / drive.eligible) * 100))
                    : 0;

                  return (
                    <div
                      className="drive-card"
                      key={drive.id}
                      style={{
                        padding: "22px",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        background: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="drive-header" style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <CompanyLogo companyName={drive.companyName} companyUrl={drive.compUrl} size={48} />
                        <div>
                          <h3 style={{ margin: "0 0 2px", color: "#0F172A", fontSize: "1.15rem", fontWeight: "700" }}>
                            {drive.companyName}
                          </h3>
                          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>{drive.jobRole}</p>
                        </div>
                      </div>

                      <div className="drive-details" style={{ margin: "16px 0", borderTop: "1px dashed #E2E8F0", borderBottom: "1px dashed #E2E8F0", padding: "12px 0" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>PACKAGE (CTC)</span>
                          <strong style={{ color: "#0F172A", fontSize: "1.05rem" }}>₹{drive.ctc} LPA</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>DEADLINE</span>
                          <strong style={{ color: "#0F172A", fontSize: "1.05rem" }}>{drive.deadline}</strong>
                        </div>
                      </div>

                      <div className="registration" style={{ marginBottom: "16px" }}>
                        <div className="registration-heading" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.85rem", color: "#475569" }}>Registration Uptake</span>
                          <strong style={{ fontSize: "0.85rem", color: "#0F172A" }}>
                            {drive.registered} registered / {drive.eligible} eligible
                          </strong>
                        </div>
                        <div className="registration-bar" style={{ height: "8px", borderRadius: "9999px", background: "#E2E8F0", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${registrationPercentage}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #4F46E5, #3730A3)",
                              borderRadius: "9999px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>

                      <div className="drive-actions" style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          className="details-button"
                          onClick={() => navigate("/director/applications")}
                          style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                        >
                          Inspect Applications ({drive.registered}) →
                        </button>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => navigate(`/create-drive?driveId=${drive.id}`)}
                          style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                        >
                          Edit Drive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Real-time Activity Stream Feed */}
          <section className="recent-activity">
            <div className="section-header">
              <div>
                <h2>Real-Time Activity Stream & Audit Log</h2>
                <p>Live event feed of student placement requests, drive registrations, and feedback links.</p>
              </div>
            </div>

            <div className="activity-list" style={{ borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {activities.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#64748B" }}>
                  No recent activities recorded yet.
                </div>
              ) : (
                activities.map((item) => (
                  <div className="activity-item" key={item.id} style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
                    <div>
                      <strong style={{ color: "#0F172A", fontSize: "0.95rem" }}>{item.title}</strong>
                      <span style={{ color: "#475569", fontSize: "0.85rem", marginTop: "2px" }}>{item.subtitle}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        className={
                          item.type === "PLACED_REQUEST"
                            ? "badge-warning"
                            : item.type === "FEEDBACK"
                            ? "badge-success"
                            : "badge-process"
                        }
                        style={{ fontSize: "0.75rem" }}
                      >
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DirectorDashboard;