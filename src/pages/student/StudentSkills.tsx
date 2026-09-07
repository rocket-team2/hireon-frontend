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
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentSkills.css";

interface Skill {
  id: number;
  name: string;
  proficiency: number;
}

function toSkill(item: ApiStudentSkill): Skill {
  return {
    id: item.skill.skillId,
    name: item.skill.skillName,
    proficiency: item.proficiency <= 5 ? item.proficiency * 20 : item.proficiency,
  };
}

function StudentSkills() {
  const navigate = useNavigate();
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? session.user as Student : null;
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState(1);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editingProficiency, setEditingProficiency] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
    const value = Math.min(100, Math.max(1, proficiency));
    if (!name) return;

    if (skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      setError("This skill is already added.");
      return;
    }

    try {
      setError("");
      const availableSkills = await getSkills();
      const existingSkill = availableSkills.find((skill) => skill.skillName.toLowerCase() === name.toLowerCase());
      const skill = existingSkill ?? await createSkill(name);
      const savedSkill = await addStudentSkill(student.sId, skill.skillId, value);
      setSkills((currentSkills) => [...currentSkills, toSkill(savedSkill)]);
      setSkillName("");
      setProficiency(1);
    } catch {
      setError("Unable to add this skill. Make sure the backend is running.");
    }
  };

  const startEditing = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditingProficiency(skill.proficiency);
  };

  const saveProficiency = async (skillId: number) => {
    if (!student) return;

    const value = Math.min(100, Math.max(1, editingProficiency));
    try {
      setError("");
      await updateStudentSkill(student.sId, skillId, value);
      setSkills((currentSkills) => currentSkills.map((skill) => (
        skill.id === skillId ? { ...skill, proficiency: value } : skill
      )));
      setEditingSkillId(null);
    } catch {
      setError("Unable to update this skill.");
    }
  };

  const removeSkill = async (skillId: number) => {
    if (!student) return;

    try {
      await deleteStudentSkill(student.sId, skillId);
      setSkills((currentSkills) => currentSkills.filter((skill) => skill.id !== skillId));
    } catch {
      setError("Unable to remove this skill.");
    }
  };

  return (
    <StudentPageLayout activePage="skills" title="My Skills">
      <div className="student-skills-page">
        <div className="student-skills-container">
          <div className="student-skills-header">
            <div>
              <h1>My Skills</h1>
              <p>Manage your skills and proficiency levels.</p>
            </div>
            <button type="button" className="skills-back-button" onClick={() => navigate("/student-dashboard")}>
              Back to Dashboard
            </button>
          </div>

          {error && <p className="profile-saved-message" role="alert">{error}</p>}

          <section className="skills-section">
            <div className="section-title">
              <h2>Add Skill</h2>
              <p>Add a skill that you want to include in your profile.</p>
            </div>
            <div className="add-skill-form">
              <div className="skill-input-group">
                <label htmlFor="skill-name">Skill</label>
                <input id="skill-name" type="text" value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="e.g. JavaScript" />
              </div>
              <div className="skill-input-group">
                <label htmlFor="skill-proficiency">Proficiency</label>
                <input id="skill-proficiency" type="number" min="1" max="100" value={proficiency} onChange={(event) => setProficiency(Number(event.target.value))} />
              </div>
              <button type="button" className="add-skill-button" onClick={() => void addSkill()}>Add Skill</button>
            </div>
          </section>

          <section className="skills-section">
            <div className="section-title">
              <h2>Your Skills</h2>
              <p>Update your proficiency whenever your skill level changes.</p>
            </div>
            {isLoading ? <p className="no-skills">Loading skills...</p> : (
              <div className="skills-list">
                {skills.length === 0 ? <div className="no-skills"><p>No skills added yet.</p></div> : skills.map((skill) => (
                  <div className="skill-row" key={skill.id}>
                    <div className="skill-name"><strong>{skill.name}</strong></div>
                    {editingSkillId === skill.id ? (
                      <div className="skill-edit">
                        <input type="number" min="1" max="100" value={editingProficiency} onChange={(event) => setEditingProficiency(Number(event.target.value))} />
                        <button type="button" className="save-button" onClick={() => void saveProficiency(skill.id)}>Save</button>
                        <button type="button" className="cancel-button" onClick={() => setEditingSkillId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="skill-actions">
                        <div className="proficiency">
                          <span>{skill.proficiency}%</span>
                          <div className="proficiency-bar"><div style={{ width: `${skill.proficiency}%` }} /></div>
                        </div>
                        <span className="proficiency-label">{skill.proficiency}%</span>
                        <button type="button" className="edit-button" onClick={() => startEditing(skill)}>Edit</button>
                        <button type="button" className="cancel-button" onClick={() => void removeSkill(skill.id)}>Remove</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </StudentPageLayout>
  );
}

export default StudentSkills;
