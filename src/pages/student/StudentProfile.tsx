import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, getStudent, getStudentSkills, updateStudent, type Student } from "../../api";
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
  const [email, setEmail] = useState("thejashree@example.com");
  const [department, setDepartment] = useState("Information Technology");
  const [batchYear, setBatchYear] = useState("2027");
  const [role, setRole] = useState("Student");
  const [cgpa, setCgpa] = useState("9.04");
  const [activeArrears, setActiveArrears] = useState("0");
  const [arrearsHistory, setArrearsHistory] = useState("0");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resume, setResume] = useState("https://resume_url");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      navigate("/login-page", { replace: true });
      return;
    }

    const currentStudent = session.user as Student;

    void Promise.all([
      getStudent(currentStudent.sId),
      getStudentSkills(currentStudent.sId),
    ]).then(([freshStudent, studentSkills]) => {
      setStudent(freshStudent);
      setNameValue(freshStudent.name);
      setEmail(freshStudent.email);
      setDepartment(freshStudent.department);
      setBatchYear(String(freshStudent.batch_year));
      setRole(freshStudent.role);
      setCgpa(String(freshStudent.cgpa));
      setActiveArrears(String(freshStudent.active_arrear));
      setArrearsHistory(String(freshStudent.history_of_arrear));
      setResume(freshStudent.resume_url);
      setSkills(studentSkills.map((item) => ({
        id: item.skill.skillId,
        name: item.skill.skillName,
        proficiency: item.proficiency <= 5 ? item.proficiency * 20 : item.proficiency,
      })));
    }).catch(() => setError("Unable to load your profile. Make sure the backend is running."));

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
      localStorage.setItem("hireon.session", JSON.stringify({ role: "student", user: updatedStudent }));
      setIsEditing(false);
      setSaved(true);
      setError("");
    } catch {
      setError("Unable to save your profile. Make sure the backend is running.");
    }
  };
  const updateSkill = (id: number, changes: Partial<Skill>) => {
    setSkills((currentSkills) => currentSkills.map((skill) => (
      skill.id === id ? { ...skill, ...changes } : skill
    )));
  };

  return (
    <StudentPageLayout activePage="profile" title="My Profile">
      <div className="student-profile-page">
        <div className="student-profile-container">
        <div className="student-profile-header">
          <div>
            <h1>My Profile</h1>
            <p>Manage your personal details, academics, and skills.</p>
          </div>

          <div className="profile-header-actions">
            <button type="button" onClick={() => navigate("/student-dashboard")}>
              Back to Dashboard
            </button>
            <button type="button" className="primary-profile-button" onClick={isEditing ? saveProfile : () => setIsEditing(true)}>
              {isEditing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>
        </div>

        {saved && <p className="profile-saved-message" role="status">Profile updated.</p>}
        {error && <p className="profile-saved-message" role="alert">{error}</p>}

        <section className="student-profile-card">
          <div className="student-profile-top">
            <div className="student-profile-avatar">T</div>

            <div>
              <h2>{nameValue}</h2>
              <p>{department}</p>
              <span>Registration No: {student?.reg_no ?? "-"}</span>
            </div>

            <div className="profile-status">
              <span>Placement Status</span>
              <strong>Not Placed</strong>
            </div>
          </div>

          <div className="student-profile-section">
            <h3>Personal Information</h3>
            <div className="student-profile-grid">
              <label className="profile-field">
                <span>Name</span>
                <strong>{nameValue}</strong>
              </label>
              <div className="profile-field"><span>Registration Number</span><strong>{student?.reg_no ?? "-"}</strong></div>
              <label className="profile-field">
                <span>Email</span>
                {isEditing ? <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /> : <strong>{email}</strong>}
              </label>
              <label className="profile-field">
                <span>Department</span>
                {isEditing ? <input value={department} onChange={(event) => setDepartment(event.target.value)} /> : <strong>{department}</strong>}
              </label>
              <label className="profile-field">
                <span>Batch Year</span>
                {isEditing ? <input type="number" value={batchYear} onChange={(event) => setBatchYear(event.target.value)} /> : <strong>{batchYear}</strong>}
              </label>
              <label className="profile-field">
                <span>Role</span>
                {isEditing ? <input value={role} onChange={(event) => setRole(event.target.value)} /> : <strong>{role}</strong>}
              </label>
            </div>
          </div>

          <div className="student-profile-section">
            <h3>Academic Information</h3>
            <div className="student-profile-grid">
              <label className="profile-field">
                <span>CGPA</span>
                {isEditing ? <input value={cgpa} onChange={(event) => setCgpa(event.target.value)} /> : <strong>{cgpa}</strong>}
              </label>
              <label className="profile-field">
                <span>Active Arrears</span>
                {isEditing ? <input type="number" min="0" value={activeArrears} onChange={(event) => setActiveArrears(event.target.value)} /> : <strong>{activeArrears}</strong>}
              </label>
              <label className="profile-field">
                <span>History of Arrears</span>
                {isEditing ? <input type="number" min="0" value={arrearsHistory} onChange={(event) => setArrearsHistory(event.target.value)} /> : <strong>{arrearsHistory}</strong>}
              </label>
              <label className="profile-field">
                <span>Resume URL</span>
                {isEditing ? <input type="url" value={resume} onChange={(event) => setResume(event.target.value)} /> : <a href={resume} target="_blank" rel="noopener noreferrer">View Resume</a>}
              </label>
              <div className="profile-field"><span>Placement Status</span><strong className="placement-value">{student?.placement_status ?? "Not Placed"}</strong></div>
            </div>
          </div>

          <div className="student-profile-section" id="skills">
            <h3>Skills</h3>
            <div className="profile-skill-list">
              {skills.length === 0 ? <p className="empty-skills">No skills added yet.</p> : skills.map((skill) => (
                <div className="profile-skill" key={skill.id}>
                  {isEditing ? (
                    <>
                      <input
                        aria-label={`Skill name for ${skill.name}`}
                        value={skill.name}
                        onChange={(event) => updateSkill(skill.id, { name: event.target.value })}
                      />
                      <input
                        aria-label={`Proficiency for ${skill.name}`}
                        type="number"
                        min="1"
                        max="100"
                        value={skill.proficiency}
                        onChange={(event) => updateSkill(skill.id, { proficiency: Number(event.target.value) })}
                      />
                    </>
                  ) : (
                    <>
                      <span>{skill.name}</span>
                      <strong>{skill.proficiency}%</strong>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        </div>
      </div>
    </StudentPageLayout>
  );
}

export default StudentProfile;