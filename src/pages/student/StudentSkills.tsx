import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addStudentSkill,
  createSkill,
  deleteStudentSkill,
  getSession,
  getSkills,
  getStudentSkills,
  updateStudentSkill,
  type Student,
  type StudentSkill as ApiStudentSkill,
} from "../../api";
import { generateStudentEmailContent } from "../../utils/eligibility";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentSkills.css";

interface Skill {
  id: number;
  name: string;
  proficiency: number; // 1 to 5 rating
}

function toSkill(item: ApiStudentSkill): Skill {
  return {
    id: item.skill.skillId,
    name: item.skill.skillName,
    proficiency: item.proficiency <= 5 ? item.proficiency : Math.max(1, Math.round(item.proficiency / 20)),
  };
}

function StudentSkills() {
  const navigate = useNavigate();
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState(4);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editingProficiency, setEditingProficiency] = useState(4);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    if (!student) {
      navigate("/login-page", { replace: true });
      return;
    }

    void getStudentSkills(student.sId)
      .then((studentSkills) => setSkills(studentSkills.map(toSkill)))
      .catch(() => setError("Unable to load your skills. Make sure the backend is running."))
      .finally(() => setIsLoading(false));
  }, [navigate, student]);

  const addSkill = async () => {
    if (!student) return;

    const name = skillName.trim();
    const value = Math.min(5, Math.max(1, proficiency));
    if (!name) return;

    if (skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      setError("This skill is already added.");
      return;
    }

    try {
      setError("");
      const availableSkills = await getSkills();
      const existingSkill = availableSkills.find(
        (s) => s.skillName.toLowerCase() === name.toLowerCase()
      );
      const skill = existingSkill ?? (await createSkill(name));
      const savedSkill = await addStudentSkill(student.sId, skill.skillId, value);
      setSkills((currentSkills) => [...currentSkills, toSkill(savedSkill)]);
      setSkillName("");
      setProficiency(4);
    } catch {
      setError("Unable to add this skill to database.");
    }
  };

  const startEditing = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditingProficiency(skill.proficiency);
  };

  const saveProficiency = async (skillId: number) => {
    if (!student) return;

    const value = Math.min(5, Math.max(1, editingProficiency));
    try {
      setError("");
      await updateStudentSkill(student.sId, skillId, value);
      setSkills((currentSkills) =>
        currentSkills.map((s) => (s.id === skillId ? { ...s, proficiency: value } : s))
      );
      setEditingSkillId(null);
    } catch {
      setError("Unable to update this skill.");
    }
  };

  const removeSkill = async (skillId: number) => {
    if (!student) return;

    try {
      await deleteStudentSkill(student.sId, skillId);
      setSkills((currentSkills) => currentSkills.filter((s) => s.id !== skillId));
    } catch {
      setError("Unable to remove this skill.");
    }
  };

  const emailPayload = student
    ? generateStudentEmailContent(
        student,
        skills.map((s) => ({ name: s.name, proficiency: s.proficiency }))
      )
    : { subject: "", body: "" };

  const handleSendEmail = () => {
    if (!student) return;
    const mailtoUrl = `mailto:${encodeURIComponent(student.email)}?subject=${encodeURIComponent(
      emailPayload.subject
    )}&body=${encodeURIComponent(emailPayload.body)}`;
    window.open(mailtoUrl, "_blank");
    setEmailModalOpen(false);
  };

  return (
    <StudentPageLayout activePage="skills" title="My Skills">
      <div className="student-skills-page">
        <div className="student-skills-container">
          <div className="student-skills-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>My Skills & Proficiencies</h1>
              <p>Record your technical proficiencies and share skill reports with recruiters.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {/* Requirement 8: Email Trigger Button */}
              <button
                type="button"
                className="badge-process"
                style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid #A6CEF7" }}
                onClick={() => setEmailModalOpen(true)}
              >
                📧 Email Skills Report
              </button>

              <button
                type="button"
                className="skills-back-button"
                onClick={() => navigate("/student-dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {error && <div className="alert-danger-box" role="alert">{error}</div>}

          <section className="skills-section">
            <div className="section-title">
              <h2>Add Verified Skill</h2>
              <p>Add technical or domain skills to increase your placement eligibility score.</p>
            </div>
            <div className="add-skill-form">
              <div className="skill-input-group">
                <label htmlFor="skill-name">Skill Name</label>
                <input
                  id="skill-name"
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Java, Python, SQL"
                />
              </div>
              <div className="skill-input-group">
                <label htmlFor="skill-proficiency">Proficiency Rating (1 - 5 Stars)</label>
                <input
                  id="skill-proficiency"
                  type="number"
                  min="1"
                  max="5"
                  value={proficiency}
                  onChange={(e) => setProficiency(Number(e.target.value))}
                />
              </div>
              <button type="button" className="add-skill-button" onClick={() => void addSkill()}>
                + Add Skill
              </button>
            </div>
          </section>

          <section className="skills-section">
            <div className="section-title">
              <h2>Verified Skill Breakdown</h2>
              <p>Update your proficiency level whenever your skills improve.</p>
            </div>
            {isLoading ? (
              <p className="no-skills">Loading skills...</p>
            ) : (
              <div className="skills-list">
                {skills.length === 0 ? (
                  <div className="no-skills">
                    <p>No skills added yet.</p>
                  </div>
                ) : (
                  skills.map((skill) => (
                    <div className="skill-row" key={skill.id}>
                      <div className="skill-name">
                        <strong>{skill.name}</strong>
                      </div>
                      {editingSkillId === skill.id ? (
                        <div className="skill-edit">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={editingProficiency}
                            onChange={(e) => setEditingProficiency(Number(e.target.value))}
                          />
                          <button
                            type="button"
                            className="save-button"
                            onClick={() => void saveProficiency(skill.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setEditingSkillId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="skill-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span className="badge-process">Rating: {skill.proficiency} / 5 ★</span>
                          <button type="button" className="edit-button" onClick={() => startEditing(skill)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => void removeSkill(skill.id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Requirement 8: Email Modal */}
      {emailModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>📧 Share Skill Proficiency Report</h3>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="alert-process-box">
              <strong>Skill Proficiency Report Preview:</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                Pre-formatted email body containing your skill breakdown.
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

              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#042C53" }}>Body:</label>
              <textarea
                readOnly
                rows={9}
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
                onClick={handleSendEmail}
                className="badge-success"
                style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" }}
              >
                Send via Email App
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentPageLayout>
  );
}

export default StudentSkills;
