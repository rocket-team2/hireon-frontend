import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, getStudent, getStudentSkills, updateStudent, type Student } from "../../api";
import { generateStudentEmailContent, getCompanyLogoUrl } from "../../utils/eligibility";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentProfile.css";

interface Skill {
  id: number;
  name: string;
  proficiency: number;
}

function StudentProfile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [batchYear, setBatchYear] = useState("2027");
  const [role, setRole] = useState("Student");
  const [cgpa, setCgpa] = useState("9.0");
  const [activeArrears, setActiveArrears] = useState("0");
  const [arrearsHistory, setArrearsHistory] = useState("0");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resume, setResume] = useState("");
  const [error, setError] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSentToast, setEmailSentToast] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      navigate("/login-page", { replace: true });
      return;
    }

    const currentStudent = session.user as Student;

    void Promise.all([
      getStudent(currentStudent.sId).catch(() => currentStudent),
      getStudentSkills(currentStudent.sId).catch(() => []),
    ]).then(([freshStudent, studentSkills]) => {
      setStudent(freshStudent);
      setNameValue(freshStudent.name);
      setEmail(freshStudent.email);
      setDepartment(freshStudent.department);
      setBatchYear(String(freshStudent.batch_year));
      setRole(freshStudent.role || "Student");
      setCgpa(String(freshStudent.cgpa));
      setActiveArrears(String(freshStudent.active_arrear));
      setArrearsHistory(String(freshStudent.history_of_arrear));
      setResume(freshStudent.resume_url || "https://resume.pdf");
      setSkills(
        studentSkills.map((item) => ({
          id: item.skill.skillId,
          name: item.skill.skillName,
          proficiency: item.proficiency <= 5 ? item.proficiency : Math.round(item.proficiency / 20),
        }))
      );
    });

    if (window.location.hash === "#skills") {
      document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [navigate]);

  const saveProfile = async () => {
    if (!student) return;

    try {
      const updatedStudent = await updateStudent({
        ...student,
        name: nameValue,
        email,
        department,
        batch_year: Number(batchYear),
        role,
        cgpa: Number(cgpa),
        active_arrear: Number(activeArrears),
        history_of_arrear: Number(arrearsHistory),
        resume_url: resume,
      });
      setStudent(updatedStudent);
      localStorage.setItem(
        "hireon.session",
        JSON.stringify({ role: "student", user: updatedStudent })
      );
      setIsEditing(false);
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError("Unable to save profile changes to database.");
    }
  };

  const updateSkill = (id: number, changes: Partial<Skill>) => {
    setSkills((currentSkills) =>
      currentSkills.map((skill) => (skill.id === id ? { ...skill, ...changes } : skill))
    );
  };

  const isPlaced = student?.placement_status === "Placed" || Boolean(student?.company);
  const companyName = student?.company?.c_name || (isPlaced ? "Campus Recruiting Partner" : "");
  const companyLogoUrl = getCompanyLogoUrl(companyName, student?.company?.comp_url);

  const emailPayload = student
    ? generateStudentEmailContent(
        student,
        skills.map((s) => ({ name: s.name, proficiency: s.proficiency }))
      )
    : { subject: "", body: "" };

  const handleSendEmailReport = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      emailPayload.subject
    )}&body=${encodeURIComponent(emailPayload.body)}`;
    window.open(mailtoUrl, "_blank");
    setEmailSentToast(true);
    setEmailModalOpen(false);
    setTimeout(() => setEmailSentToast(false), 5000);
  };

  return (
    <StudentPageLayout activePage="profile" title="My Profile">
      <div className="student-profile-page">
        <div className="student-profile-container">
          <div className="student-profile-header">
            <div>
              <h1>My Profile</h1>
              <p>Manage your personal details, academic metrics, and skill proficiencies.</p>
            </div>

            <div className="profile-header-actions" style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="badge-process"
                style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid #A6CEF7" }}
                onClick={() => setEmailModalOpen(true)}
              >
                📧 Email Profile & Skills Report
              </button>

              <button
                type="button"
                className="primary-profile-button"
                onClick={isEditing ? saveProfile : () => setIsEditing(true)}
              >
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>
            </div>
          </div>

          {saved && <p className="alert-success-box" role="status">✓ Profile updated successfully.</p>}
          {emailSentToast && <p className="alert-success-box" role="status">✓ Email draft prepared and sent!</p>}
          {error && <p className="alert-danger-box" role="alert">{error}</p>}

          {/* Requirements 5 & 11: Placed Company Celebration Banner */}
          {isPlaced ? (
            <section
              className="alert-success-box"
              style={{
                marginBottom: "1.5rem",
                padding: "20px 24px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                border: "2px solid #C3E2A0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="company-logo-img"
                  style={{ width: "56px", height: "56px" }}
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/56?text=CO";
                  }}
                />
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    🎉 CAMPUS PLACEMENT CONFIRMED
                  </span>
                  <h2 style={{ margin: "2px 0", color: "#3B6D11", fontSize: "1.5rem", fontWeight: "800" }}>
                    Placed at {companyName}
                  </h2>
                  <p style={{ margin: 0, color: "#3B6D11", fontSize: "0.95rem" }}>
                    Congratulations on securing your campus offer with {companyName}!
                  </p>
                </div>
              </div>

              <div>
                <span className="badge-success" style={{ fontSize: "1rem", padding: "8px 16px" }}>
                  STATUS: PLACED ✓
                </span>
              </div>
            </section>
          ) : (
            <section
              className="alert-process-box"
              style={{ marginBottom: "1.5rem", padding: "16px 20px", borderRadius: "12px" }}
            >
              <strong>Placement Status: Seeking / In Progress</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                Your profile is active for recruitment drives. Keep your skills and resume up to date.
              </p>
            </section>
          )}

          <section className="student-profile-card">
            <div className="student-profile-top">
              <div className="student-profile-avatar">
                {nameValue ? nameValue.charAt(0).toUpperCase() : "S"}
              </div>

              <div>
                <h2>{nameValue}</h2>
                <p>{department}</p>
                <span>Registration No: {student?.reg_no ?? "-"}</span>
              </div>

              <div className="profile-status">
                <span>Placement Status</span>
                <strong>{isPlaced ? `Placed @ ${companyName}` : "Unplaced / Seeking"}</strong>
              </div>
            </div>

            <div className="student-profile-section">
              <h3>Personal Information</h3>
              <div className="student-profile-grid">
                <label className="profile-field">
                  <span>Name</span>
                  {isEditing ? (
                    <input value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
                  ) : (
                    <strong>{nameValue}</strong>
                  )}
                </label>
                <div className="profile-field">
                  <span>Registration Number</span>
                  <strong>{student?.reg_no ?? "-"}</strong>
                </div>
                <label className="profile-field">
                  <span>Email</span>
                  {isEditing ? (
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  ) : (
                    <strong>{email}</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>Department</span>
                  {isEditing ? (
                    <input value={department} onChange={(e) => setDepartment(e.target.value)} />
                  ) : (
                    <strong>{department}</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>Batch Year</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                    />
                  ) : (
                    <strong>{batchYear}</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>Role</span>
                  {isEditing ? (
                    <input value={role} onChange={(e) => setRole(e.target.value)} />
                  ) : (
                    <strong>{role}</strong>
                  )}
                </label>
              </div>
            </div>

            <div className="student-profile-section">
              <h3>Academic Metrics</h3>
              <div className="student-profile-grid">
                <label className="profile-field">
                  <span>CGPA</span>
                  {isEditing ? (
                    <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
                  ) : (
                    <strong>{cgpa} / 10.0</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>Active Arrears</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={activeArrears}
                      onChange={(e) => setActiveArrears(e.target.value)}
                    />
                  ) : (
                    <strong>{activeArrears}</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>History of Arrears</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={arrearsHistory}
                      onChange={(e) => setArrearsHistory(e.target.value)}
                    />
                  ) : (
                    <strong>{arrearsHistory}</strong>
                  )}
                </label>
                <label className="profile-field">
                  <span>Resume Link</span>
                  {isEditing ? (
                    <input type="url" value={resume} onChange={(e) => setResume(e.target.value)} />
                  ) : (
                    <a href={resume} target="_blank" rel="noopener noreferrer">
                      View Resume Document 📄
                    </a>
                  )}
                </label>
                <div className="profile-field">
                  <span>Placed Company</span>
                  <strong>{isPlaced ? companyName : "Not Placed Yet"}</strong>
                </div>
              </div>
            </div>

            <div className="student-profile-section" id="skills">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Verified Skills & Proficiency</h3>
                <span className="badge-process">1 - 5 Proficiency Scale</span>
              </div>

              <div className="profile-skill-list" style={{ marginTop: "1rem" }}>
                {skills.length === 0 ? (
                  <p className="empty-skills">No skills added yet.</p>
                ) : (
                  skills.map((skill) => (
                    <div className="profile-skill" key={skill.id} style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "8px" }}>
                      {isEditing ? (
                        <>
                          <input
                            aria-label={`Skill name for ${skill.name}`}
                            value={skill.name}
                            onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                          />
                          <input
                            aria-label={`Proficiency for ${skill.name}`}
                            type="number"
                            min="1"
                            max="5"
                            value={skill.proficiency}
                            onChange={(e) =>
                              updateSkill(skill.id, { proficiency: Number(e.target.value) })
                            }
                          />
                        </>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                          <strong style={{ fontSize: "1rem", color: "#042C53" }}>{skill.name}</strong>
                          <div className="badge-process">
                            Proficiency: {skill.proficiency}/5 ★
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Requirement 8: Email Modal with Proficiency Details */}
      {emailModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>📧 Student Email & Proficiency Dispatch</h3>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="alert-process-box">
              <strong>Preview Auto-Generated Email Content:</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                This payload includes student info, academic scores, placement status, and skill ratings.
              </p>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#042C53" }}>Subject:</label>
              <input
                type="text"
                readOnly
                value={emailPayload.subject}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", margin: "4px 0 12px", background: "#F8FAFC" }}
              />

              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#042C53" }}>Email Body:</label>
              <textarea
                readOnly
                rows={10}
                value={emailPayload.body}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  background: "#F8FAFC",
                }}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailReport}
                className="badge-success"
                style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}
              >
                Send via Email App (mailto:)
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentPageLayout>
  );
}

export default StudentProfile;