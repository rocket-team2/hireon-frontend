import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentProfile.css";

interface Skill {
  id: number;
  name: string;
  proficiency: number;
}

function getSavedSkills(): Skill[] {
  const savedSkills = localStorage.getItem("studentSkills");
  if (!savedSkills) {
    return [];
  }

  return (JSON.parse(savedSkills) as Skill[]).map((skill) => ({
    ...skill,
    proficiency: skill.proficiency <= 5 ? skill.proficiency * 20 : skill.proficiency,
  }));
}

function StudentProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState("Thejashree V M");
  const [email, setEmail] = useState("thejashree@example.com");
  const [cgpa, setCgpa] = useState("9.04");
  const [skills] = useState<Skill[]>(getSavedSkills);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#skills") {
      document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const saveProfile = () => {
    setIsEditing(false);
    setSaved(true);
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

        <section className="student-profile-card">
          <div className="student-profile-top">
            <div className="student-profile-avatar">T</div>

            <div>
              <h2>{name}</h2>
              <p>Information Technology</p>
              <span>Registration No: CIT21IT001</span>
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
                {isEditing ? <input value={name} onChange={(event) => setName(event.target.value)} /> : <strong>{name}</strong>}
              </label>
              <div className="profile-field"><span>Registration Number</span><strong>CIT21IT001</strong></div>
              <label className="profile-field">
                <span>Email</span>
                {isEditing ? <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /> : <strong>{email}</strong>}
              </label>
              <div className="profile-field"><span>Department</span><strong>Information Technology</strong></div>
              <div className="profile-field"><span>Batch Year</span><strong>2027</strong></div>
              <div className="profile-field"><span>Role</span><strong>Student</strong></div>
            </div>
          </div>

          <div className="student-profile-section">
            <h3>Academic Information</h3>
            <div className="student-profile-grid">
              <label className="profile-field">
                <span>CGPA</span>
                {isEditing ? <input value={cgpa} onChange={(event) => setCgpa(event.target.value)} /> : <strong>{cgpa}</strong>}
              </label>
              <div className="profile-field"><span>Active Arrears</span><strong>0</strong></div>
              <div className="profile-field"><span>History of Arrears</span><strong>0</strong></div>
              <div className="profile-field"><span>Placement Status</span><strong className="placement-value">Not Placed</strong></div>
            </div>
          </div>

          <div className="student-profile-section" id="skills">
            <h3>Skills</h3>
            <div className="profile-skill-list">
              {skills.length === 0 ? <p className="empty-skills">No skills added yet.</p> : skills.map((skill) => (
                <div className="profile-skill" key={skill.id}>
                  <span>{skill.name}</span>
                  <strong>{skill.proficiency}%</strong>
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