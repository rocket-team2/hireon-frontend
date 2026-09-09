import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import {
  getDrive,
  registerForDrive,
  getStudentRegistrations,
  departmentsFromDrive,
  getRequiredSkills,
  getDriveRounds,
  getShortlistedByStudent,
  type Drive,
  type Registration,
  type RequiredSkill,
  type Student,
  type DriveRound,
  type ShortlistedStudent,
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
import "./StudentDriveDetails.css";

function StudentDriveDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [drive, setDrive] = useState<Drive | null>(null);
  const [requiredSkills, setRequiredSkills] = useState<RequiredSkill[]>([]);
  const [driveRounds, setDriveRounds] = useState<DriveRound[]>([]);
  const [studentShortlists, setStudentShortlists] = useState<ShortlistedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [placedModalOpen, setPlacedModalOpen] = useState(false);
  const [placedSuccessMsg, setPlacedSuccessMsg] = useState("");
  const [placedRequest, setPlacedRequest] = useState<PlacedApplicationRequest | null>(null);

  const session = JSON.parse(localStorage.getItem("hireon.session") || "null");
  const student = session?.role === "student" ? (session.user as Student) : null;
  const studentId = student?.sId;
  const studentName = student?.name || "Student";
  const department = student?.department || "";

  useEffect(() => {
    void loadDrive();

    const handleSync = () => {
      if (!id || !studentId) return;
      const driveId = Number(id);
      const reqs = getPlacedApplications();
      const req = reqs.find((r) => r.driveId === driveId && r.studentId === studentId) || null;
      setPlacedRequest(req);
      if (req?.status === "APPROVED") {
        setRegistered(true);
      }
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("placed_apps_synced", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("placed_apps_synced", handleSync);
    };
  }, [id, studentId]);

  const loadDrive = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      const driveId = Number(id);
      const driveData = await getDrive(driveId);
      setDrive(driveData);

      try {
        const skills = await getRequiredSkills(driveId);
        setRequiredSkills(skills);
      } catch (err) {
        console.log("Required skills not available", err);
      }

      try {
        const roundsData = await getDriveRounds(driveId);
        setDriveRounds(roundsData);
      } catch (err) {
        console.log("Drive rounds not available", err);
      }

      if (studentId) {
        try {
          const registrations = await getStudentRegistrations(studentId);
          const alreadyRegistered = registrations.some(
            (r: Registration) => r.drive?.driveId === driveId
          );
          setRegistered(alreadyRegistered);
        } catch (err) {
          console.log("Unable to check registration", err);
        }

        try {
          const shortlistsData = await getShortlistedByStudent(studentId);
          setStudentShortlists(shortlistsData);
        } catch (err) {
          console.log("Unable to check student shortlists", err);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load placement drive details.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    if (!drive || !student) return;

    // Placed student requires Director approval before registration
    const isPlaced = student.placement_status === "Placed" || Boolean(student.company);
    if (isPlaced) {
      if (placedRequest?.status === "PENDING" || placedRequest?.status === "REJECTED" || registered) {
        return;
      }
      setPlacedModalOpen(true);
      return;
    }

    // Unplaced student: directly register for drive
    void executeRegister();
  };

  const executeRegister = async () => {
    if (!drive || !studentId) return;

    try {
      setRegistering(true);
      await registerForDrive(drive.driveId, studentId);
      setRegistered(true);
      alert("Successfully registered for this placement drive!");
    } catch (err: any) {
      alert(err?.message || "Unable to register for this drive.");
    } finally {
      setRegistering(false);
    }
  };

  const handleConfirmPlacedApplication = () => {
    if (!drive || !student) return;
    const saved = savePlacedApplicationRequest(drive, student);
    setPlacedRequest(saved);
    setPlacedSuccessMsg(`Approval request for ${drive.company?.c_name ?? "Company"} submitted to Placement Director! Once approved, your registration will be activated.`);
    setPlacedModalOpen(false);
  };

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
      case "profile":
        navigate("/student-profile");
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hireon.session");
    localStorage.removeItem("hireon.role");
    navigate("/login-page");
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <StudentSidebar activePage="drives" onNavigate={handleNavigation} onLogout={handleLogout} />
        <div className="student-dashboard-main">
          <StudentHeader studentName={studentName} department={department} />
          <main className="student-drive-details">
            <div className="details-loading">Loading placement drive...</div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="student-dashboard">
        <StudentSidebar activePage="drives" onNavigate={handleNavigation} onLogout={handleLogout} />
        <div className="student-dashboard-main">
          <StudentHeader studentName={studentName} department={department} />
          <main className="student-drive-details">
            <div className="details-error">
              <h2>Drive Not Found</h2>
              <p>{error || "The placement drive could not be found."}</p>
              <button onClick={() => navigate("/student/drives")}>← Back to Placement Drives</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const departments = departmentsFromDrive(drive.allowed_dept);
  const deadline = new Date(drive.deadline);
  const isExpired = deadline.getTime() < Date.now();
  const companyLogoUrl = getCompanyLogoUrl(drive.company?.c_name ?? "", drive.company?.comp_url);

  // Requirement 2 & 3: Eligibility score & reasons calculation
  const eligResult: EligibilityResult = calculateEligibility(student, drive, requiredSkills);
  const { score, isEligible, reasons } = eligResult;
  const isStudentPlaced = student?.placement_status === "Placed" || Boolean(student?.company);

  // Helper to build timeline items for the current drive & student
  const getTimelineItems = () => {
    type TimelineItem = {
      id: string | number;
      name: string;
      description?: string;
      roundLink?: string;
      startTime?: string;
      endTime?: string;
      isFinal?: boolean;
      status: "SELECTED" | "REJECTED" | "PENDING" | "UPCOMING";
      statusLabel: string;
      feedbackUrl?: string;
    };

    if (driveRounds.length > 0) {
      let previousRejected = false;

      return driveRounds.map((r, index) => {
        const shortlistRecord = studentShortlists.find(
          (s) => s.round?.roundId === r.roundId
        );

        let status: "SELECTED" | "REJECTED" | "PENDING" | "UPCOMING" = "UPCOMING";
        let statusLabel = "Upcoming";

        if (shortlistRecord) {
          const rawStatus = (shortlistRecord.status || "").toUpperCase();
          if (["SELECTED", "SHORTLISTENED", "PASSED"].includes(rawStatus)) {
            status = "SELECTED";
            statusLabel = "Shortlisted / Selected";
          } else if (["REJECTED", "NOT_SHORTLISTENED"].includes(rawStatus)) {
            status = "REJECTED";
            statusLabel = "Not Shortlisted";
            previousRejected = true;
          } else if (["PENDING", "WAITLISTED"].includes(rawStatus)) {
            status = "PENDING";
            statusLabel = "Pending Review";
          }
        } else if (previousRejected) {
          status = "REJECTED";
          statusLabel = "Not Shortlisted (Eliminated)";
        } else if (registered) {
          if (index === 0) {
            status = "SELECTED";
            statusLabel = "Registered (In Progress)";
          } else {
            status = "PENDING";
            statusLabel = "Awaiting Evaluation";
          }
        } else {
          status = "UPCOMING";
          statusLabel = "Pending Registration";
        }

        return {
          id: r.roundId,
          name: r.roundName || `Round ${index + 1}`,
          description: r.description,
          roundLink: r.roundLink,
          startTime: r.startTime,
          endTime: r.endTime,
          isFinal: r.isFinal,
          status,
          statusLabel,
          feedbackUrl: shortlistRecord?.feedbackUrl,
        } as TimelineItem;
      });
    }

    // Default recruitment pipeline fallback when no specific drive rounds exist yet
    const defaultRounds = [
      { name: "Aptitude Assessment", desc: "Online aptitude test covering logical reasoning, quantitative aptitude and verbal ability." },
      { name: "Technical Interview", desc: "Technical discussion covering programming, problem solving and core technical concepts." },
      { name: "HR & Cultural Fit Interview", desc: "Executive discussion, behavioral assessment, team fit, and compensation overview." },
    ];

    const driveShortlists = studentShortlists.filter(
      (s) => s.round?.drive?.driveId === drive?.driveId
    );

    let previousRejected = false;

    return defaultRounds.map((dr, index) => {
      const shortlistRecord = driveShortlists[index];
      let status: "SELECTED" | "REJECTED" | "PENDING" | "UPCOMING" = "UPCOMING";
      let statusLabel = "Upcoming";

      if (shortlistRecord) {
        const rawStatus = (shortlistRecord.status || "").toUpperCase();
        if (["SELECTED", "SHORTLISTENED", "PASSED"].includes(rawStatus)) {
          status = "SELECTED";
          statusLabel = "Shortlisted / Selected";
        } else if (["REJECTED", "NOT_SHORTLISTENED"].includes(rawStatus)) {
          status = "REJECTED";
          statusLabel = "Not Shortlisted";
          previousRejected = true;
        } else if (["PENDING", "WAITLISTED"].includes(rawStatus)) {
          status = "PENDING";
          statusLabel = "Pending Review";
        }
      } else if (previousRejected) {
        status = "REJECTED";
        statusLabel = "Not Shortlisted";
      } else if (registered) {
        if (index === 0) {
          status = "SELECTED";
          statusLabel = "Registered & Eligible";
        } else if (index === 1) {
          status = "PENDING";
          statusLabel = "In Review";
        } else {
          status = "UPCOMING";
          statusLabel = "Upcoming";
        }
      } else {
        status = "UPCOMING";
        statusLabel = "Pending Registration";
      }

      return {
        id: `default-${index}`,
        name: dr.name,
        description: dr.desc,
        isFinal: index === defaultRounds.length - 1,
        status,
        statusLabel,
        feedbackUrl: shortlistRecord?.feedbackUrl,
      } as TimelineItem;
    });
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar activePage="drives" onNavigate={handleNavigation} onLogout={handleLogout} />

      <div className="student-dashboard-main">
        <StudentHeader
          studentName={studentName}
          department={department}
          placementStatus={student?.placement_status}
          companyName={student?.company?.c_name}
        />

        <main className="student-drive-details">
          <button className="details-back-button" onClick={() => navigate("/student/drives")}>
            ← Back to Placement Drives
          </button>

          {placedSuccessMsg && (
            <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>
              ✓ {placedSuccessMsg}
            </div>
          )}

          {/* Drive Header */}
          <section className="drive-details-header" style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div className="drive-details-title" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <img
                src={companyLogoUrl}
                alt={drive.company?.c_name}
                className="company-logo-img"
                style={{ width: "64px", height: "64px" }}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/64?text=CO";
                }}
              />

              <div>
                <div className="details-small-label" style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.5px" }}>
                  CAMPUS PLACEMENT DRIVE
                </div>
                <h1 style={{ margin: "2px 0", color: "#042C53", fontSize: "1.75rem", fontWeight: "800" }}>
                  {drive.company?.c_name}
                </h1>
                <p style={{ margin: 0, color: "#64748B", fontSize: "1rem" }}>{drive.job_role}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* Requirement 2: Eligibility Score Badge */}
              <span
                className={
                  isEligible ? (score >= 75 ? "badge-success" : "badge-process") : "badge-danger"
                }
                style={{ padding: "8px 14px", fontSize: "0.95rem" }}
              >
                {isEligible ? `Eligibility Score: ${score}%` : "Not Eligible"}
              </span>

              {/* Requirement 10: Hover Button for Director Page */}
              <div className="hover-popover-trigger">
                <button
                  type="button"
                  className="director-hover-btn"
                  onClick={() => navigate("/director-dashboard")}
                  style={{ padding: "8px 14px" }}
                >
                  Director Info ℹ️
                </button>
                <div className="hover-popover">
                  <strong>🏢 Placement Director Control</strong>
                  <p style={{ margin: "4px 0" }}>For authority override, requests, and drive details.</p>
                  <small style={{ color: "#92C5F8" }}>Click to open Director Portal</small>
                </div>
              </div>
            </div>
          </section>

          {/* Requirement 3: Explicit Not Eligible Reasons Box */}
          {!isEligible && reasons.length > 0 && (
            <section className="alert-danger-box" style={{ marginTop: "1rem" }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>❌ Why You Are Not Eligible For This Drive:</h3>
              <ul>
                {reasons.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Job Details Card */}
          <section className="details-card">
            <div className="details-card-heading">
              <div>
                <h2>Job & Compensation Details</h2>
                <p>Role specifications and recruitment metrics</p>
              </div>
            </div>

            <div className="details-info-grid">
              <div className="details-info-item">
                <span>Company</span>
                <strong>{drive.company?.c_name}</strong>
              </div>

              <div className="details-info-item">
                <span>Job Role</span>
                <strong>{drive.job_role}</strong>
              </div>

              <div className="details-info-item">
                <span>Package (CTC)</span>
                <strong>₹{drive.ctc_lpa} LPA</strong>
              </div>

              <div className="details-info-item">
                <span>Target Batch</span>
                <strong>{drive.target_cg_batch}</strong>
              </div>

              <div className="details-info-item">
                <span>Max Active Arrears</span>
                <strong>{drive.max_arrear}</strong>
              </div>

              <div className="details-info-item">
                <span>Deadline</span>
                <strong>
                  {deadline.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>
          </section>

          {/* About Opportunity */}
          <section className="details-card">
            <h2>About the Opportunity</h2>
            <p className="details-description">
              {drive.description || "No description provided for this placement opportunity."}
            </p>
          </section>

          {/* Placement Process Timeline */}
          <section className="details-card placement-process-card">
            <div className="placement-process-header">
              <div>
                <h2>Placement Process</h2>
                <p className="section-description">
                  Follow the recruitment rounds and track your selection progress
                </p>
              </div>
              {registered && (
                <span className="registered-pill">
                  ✓ Registered for Drive
                </span>
              )}
            </div>

            <div className="process-timeline-container">
              {getTimelineItems().map((item, idx) => {
                const isSelected = item.status === "SELECTED";
                const isRejected = item.status === "REJECTED";
                const isPending = item.status === "PENDING";
                const isRight = idx % 2 === 1;

                return (
                  <div
                    key={item.id}
                    className={`process-timeline-row ${isRight ? "align-right" : "align-left"} ${
                      isSelected ? "status-selected" : isRejected ? "status-rejected" : isPending ? "status-pending" : "status-upcoming"
                    }`}
                  >
                    {/* Left Slot */}
                    <div className="timeline-slot slot-left">
                      {!isRight ? (
                        <div className="timeline-card-box">
                          <div className="card-top-row">
                            <span className="round-tag">{`Round ${idx + 1}`}</span>
                            <span className={`status-tag ${item.status.toLowerCase()}`}>
                              {isSelected && "✓ "}
                              {isRejected && "✕ "}
                              {isPending && "⏳ "}
                              {item.statusLabel}
                            </span>
                          </div>

                          <h3 className="card-title">
                            {item.name} {item.isFinal ? <span className="final-round-tag">Final</span> : null}
                          </h3>

                          {item.description && <p className="card-description">{item.description}</p>}

                          {(item.roundLink || item.feedbackUrl || item.startTime) && (
                            <div className="card-actions-row">
                              {item.startTime && (
                                <span className="time-badge">
                                  📅 {new Date(item.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                              )}
                              {item.roundLink && (
                                <a href={item.roundLink} target="_blank" rel="noreferrer" className="action-link-btn">
                                  🔗 Join Round →
                                </a>
                              )}
                              {item.feedbackUrl && (
                                <a href={item.feedbackUrl} target="_blank" rel="noreferrer" className="feedback-btn">
                                  📝 View Notes
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="timeline-meta-label">
                          <span className="meta-round-title">{`Round ${idx + 1}`}</span>
                          <span className="meta-round-name">{item.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Center Slot (Node & Connecting Track) */}
                    <div className="timeline-slot slot-center">
                      <div className="timeline-track-line" />
                      <div className="timeline-node-circle">
                        {isSelected ? "✓" : isRejected ? "✕" : idx + 1}
                      </div>
                    </div>

                    {/* Right Slot */}
                    <div className="timeline-slot slot-right">
                      {isRight ? (
                        <div className="timeline-card-box">
                          <div className="card-top-row">
                            <span className="round-tag">{`Round ${idx + 1}`}</span>
                            <span className={`status-tag ${item.status.toLowerCase()}`}>
                              {isSelected && "✓ "}
                              {isRejected && "✕ "}
                              {isPending && "⏳ "}
                              {item.statusLabel}
                            </span>
                          </div>

                          <h3 className="card-title">
                            {item.name} {item.isFinal ? <span className="final-round-tag">Final</span> : null}
                          </h3>

                          {item.description && <p className="card-description">{item.description}</p>}

                          {(item.roundLink || item.feedbackUrl || item.startTime) && (
                            <div className="card-actions-row">
                              {item.startTime && (
                                <span className="time-badge">
                                  📅 {new Date(item.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                </span>
                              )}
                              {item.roundLink && (
                                <a href={item.roundLink} target="_blank" rel="noreferrer" className="action-link-btn">
                                  🔗 Join Round →
                                </a>
                              )}
                              {item.feedbackUrl && (
                                <a href={item.feedbackUrl} target="_blank" rel="noreferrer" className="feedback-btn">
                                  📝 View Notes
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="timeline-meta-label">
                          <span className="meta-round-title">{`Round ${idx + 1}`}</span>
                          <span className="meta-round-name">{item.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Eligibility Specs */}
          <section className="details-card">
            <h2>Eligibility & Criteria</h2>
            <div className="eligibility-grid">
              <div className="eligibility-item">
                <span>Eligible Batch</span>
                <strong>{drive.target_cg_batch}</strong>
              </div>

              <div className="eligibility-item">
                <span>Max Allowed Arrears</span>
                <strong>{drive.max_arrear}</strong>
              </div>

              <div className="eligibility-item">
                <span>Your Department</span>
                <strong>{department || "Not Available"}</strong>
              </div>
            </div>

            {departments.length > 0 && (
              <div className="eligible-departments" style={{ marginTop: "1rem" }}>
                <span>Allowed Departments</span>
                <div className="department-tags">
                  {departments.map((dept, index) => (
                    <span key={index} className="department-tag" style={{ background: "#E6F1FB", color: "#042C53" }}>
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Required Skills */}
          {requiredSkills.length > 0 && (
            <section className="details-card">
              <h2>Required Skills & Proficiencies</h2>
              <div className="required-skills">
                {requiredSkills.map((item) => (
                  <div className="required-skill" key={item.req_id}>
                    <div>
                      <strong>{item.skill?.skillName}</strong>
                      <span>Required rating</span>
                    </div>
                    <div className="proficiency">{item.reqProficiency}/5</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Company Information */}
          <section className="details-card">
            <h2>Company Profile</h2>
            <div className="company-information">
              <div className="company-information-name">
                <img src={companyLogoUrl} alt={drive.company?.c_name} className="company-logo-img" />
                <div>
                  <strong>{drive.company?.c_name}</strong>
                  <span>Recruiting through HireOn Campus Cell</span>
                </div>
              </div>

              {drive.company?.comp_url && (
                <a
                  href={drive.company.comp_url.startsWith("http") ? drive.company.comp_url : `https://${drive.company.comp_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="company-link"
                >
                  Visit Official Website →
                </a>
              )}
            </div>
          </section>

          {/* Placed Student Status Notice Banner if applicable */}
          {isStudentPlaced && placedRequest && (
            <section style={{ marginTop: "1rem" }}>
              {placedRequest.status === "PENDING" && (
                <div className="alert-process-box">
                  <strong>⏳ Director Approval Pending</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                    Your application request for <strong>{drive.company?.c_name} - {drive.job_role}</strong> was submitted on {placedRequest.requestedAt} and is currently under review by the Placement Director. You cannot register directly until the Director approves.
                  </p>
                </div>
              )}
              {placedRequest.status === "REJECTED" && (
                <div className="alert-danger-box">
                  <strong>❌ Director Rejected Application</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                    The Placement Director has rejected your application request for this drive. In accordance with institution policy, placed students cannot register for this drive without approval.
                  </p>
                </div>
              )}
              {placedRequest.status === "APPROVED" && (
                <div className="alert-success-box">
                  <strong>✓ Director Approved!</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                    The Placement Director has approved your application request! You are officially registered for this drive.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Requirement 9: Register Section */}
          <section className="drive-application-card" style={{ marginTop: "1.5rem" }}>
            <div>
              {registered ? (
                <>
                  <h2>✓ Registered for Drive</h2>
                  <p>
                    {isStudentPlaced
                      ? "The Placement Director has approved your application. You are successfully registered for this drive."
                      : "You have successfully registered for this placement drive."}
                  </p>
                </>
              ) : isStudentPlaced ? (
                placedRequest?.status === "PENDING" ? (
                  <>
                    <h2 style={{ color: "#b45309" }}>⏳ Approval Pending with Director</h2>
                    <p>
                      Your request has been submitted to the Placement Director. Once approved, you will be registered automatically.
                    </p>
                  </>
                ) : placedRequest?.status === "REJECTED" ? (
                  <>
                    <h2 style={{ color: "#b91c1c" }}>❌ Registration Denied</h2>
                    <p>
                      The Placement Director rejected your request to apply. Registration is not permitted for this drive.
                    </p>
                  </>
                ) : (
                  <>
                    <h2>Director Approval Required</h2>
                    <p>
                      You are currently placed at <strong>{student?.company?.c_name ?? "your company"}</strong>. Placed students must submit an approval request to the Director before registering.
                    </p>
                  </>
                )
              ) : (
                <>
                  <h2>Ready to Apply?</h2>
                  <p>
                    {isExpired
                      ? "The registration deadline for this drive has passed."
                      : `Apply before ${deadline.toLocaleDateString("en-IN")}. Direct registration is available.`}
                  </p>
                </>
              )}
            </div>

            <button
              className={`register-button ${registered
                ? "registered"
                : isStudentPlaced && placedRequest?.status === "PENDING"
                  ? "pending-approval"
                  : isStudentPlaced && placedRequest?.status === "REJECTED"
                    ? "rejected-approval"
                    : isStudentPlaced
                      ? "request-approval"
                      : isEligible
                        ? "eligible"
                        : "disabled"
                }`}
              disabled={
                isExpired ||
                registered ||
                registering ||
                !isEligible ||
                (isStudentPlaced && (placedRequest?.status === "PENDING" || placedRequest?.status === "REJECTED"))
              }
              onClick={handleRegisterClick}
              style={{ padding: "12px 24px", fontSize: "1rem" }}
            >
              {registering
                ? "Registering..."
                : registered
                  ? "✓ Registered"
                  : isExpired
                    ? "Applications Closed"
                    : isStudentPlaced
                      ? placedRequest?.status === "PENDING"
                        ? "⏳ Approval Pending"
                        : placedRequest?.status === "REJECTED"
                          ? "✕ Registration Rejected"
                          : "Request Director Approval"
                      : "Register for Drive"}
            </button>
          </section>
        </main>
      </div>

      {/* Requirement 7: Placed Student Popup Modal */}
      {placedModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ color: "#993C1D" }}>⚠️ Placed Student Application Confirmation</h3>
              <button
                type="button"
                onClick={() => setPlacedModalOpen(false)}
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
                Under institution placement policy, applying for an additional drive (<strong>{drive.company?.c_name} - {drive.job_role}</strong>) requires explicit approval from the Placement Director.
              </p>
            </div>

            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#64748B" }}>
              Would you like to send an official application request to the Placement Director for review?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setPlacedModalOpen(false)}
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

export default StudentDriveDetails;