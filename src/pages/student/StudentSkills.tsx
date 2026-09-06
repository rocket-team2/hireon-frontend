import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentSkills.css";

interface Skill {
  id: number;
  name: string;
  proficiency: number;
}

const defaultSkills: Skill[] = [
  {
    id: 1,
    name: "Java",
    proficiency: 80,
  },
  {
    id: 2,
    name: "Python",
    proficiency: 60,
  },
  {
    id: 3,
    name: "React",
    proficiency: 80,
  },
  {
    id: 4,
    name: "SQL",
    proficiency: 60,
  },
];

function getSkills(): Skill[] {
  const savedSkills = localStorage.getItem("studentSkills");

  if (savedSkills) {
    const parsedSkills = JSON.parse(savedSkills) as Skill[];
    return parsedSkills.map((skill) => ({
      ...skill,
      proficiency: skill.proficiency <= 5 ? skill.proficiency * 20 : skill.proficiency,
    }));
  }

  localStorage.setItem(
    "studentSkills",
    JSON.stringify(defaultSkills)
  );

  return defaultSkills;
}

function StudentSkills() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>(getSkills);
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState(1);

  const [editingSkillId, setEditingSkillId] =
    useState<number | null>(null);

  const [editingProficiency, setEditingProficiency] =
    useState(1);

  const saveSkills = (updatedSkills: Skill[]) => {
    setSkills(updatedSkills);

    localStorage.setItem(
      "studentSkills",
      JSON.stringify(updatedSkills)
    );
  };

  const addSkill = () => {
    const name = skillName.trim();

    if (!name) {
      return;
    }

    const alreadyExists = skills.some(
      (skill) => skill.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      alert("This skill is already added.");
      return;
    }

    const newSkill: Skill = {
      id: Date.now(),
      name,
      proficiency: Math.min(100, Math.max(1, proficiency)),
    };

    saveSkills([...skills, newSkill]);

    setSkillName("");
    setProficiency(1);
  };

  const startEditing = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditingProficiency(skill.proficiency);
  };

  const saveProficiency = (skillId: number) => {
    const updatedSkills = skills.map((skill) => {
      if (skill.id === skillId) {
        return {
          ...skill,
          proficiency: Math.min(100, Math.max(1, editingProficiency)),
        };
      }

      return skill;
    });

    saveSkills(updatedSkills);

    setEditingSkillId(null);
  };

  const cancelEditing = () => {
    setEditingSkillId(null);
  };

  return (
    <StudentPageLayout activePage="skills" title="My Skills">
      <div className="student-skills-page">
        <div className="student-skills-container">

        <div className="student-skills-header">
          <div>
            <h1>My Skills</h1>
            <p>
              Manage your skills and proficiency levels.
            </p>
          </div>

          <button
            type="button"
            className="skills-back-button"
            onClick={() => navigate("/student-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>


        {/* Add Skill */}

        <section className="skills-section">

          <div className="section-title">
            <h2>Add Skill</h2>

            <p>
              Add a skill that you want to include in your profile.
            </p>
          </div>

          <div className="add-skill-form">

            <div className="skill-input-group">
              <label htmlFor="skill-name">
                Skill
              </label>

              <input
                id="skill-name"
                type="text"
                value={skillName}
                onChange={(event) =>
                  setSkillName(event.target.value)
                }
                placeholder="e.g. JavaScript"
              />
            </div>

            <div className="skill-input-group">
              <label htmlFor="skill-proficiency">
                Proficiency
              </label>

              <input
                id="skill-proficiency"
                type="number"
                min="1"
                max="100"
                value={proficiency}
                onChange={(event) =>
                  setProficiency(Number(event.target.value))
                }
              />
            </div>

            <button
              type="button"
              className="add-skill-button"
              onClick={addSkill}
            >
              Add Skill
            </button>

          </div>

        </section>


        {/* Skill List */}

        <section className="skills-section">

          <div className="section-title">
            <h2>Your Skills</h2>

            <p>
              Update your proficiency whenever your skill level changes.
            </p>
          </div>

          <div className="skills-list">

            {skills.length === 0 ? (
              <div className="no-skills">
                <p>
                  No skills added yet.
                </p>
              </div>
            ) : (
              skills.map((skill) => (
                <div
                  className="skill-row"
                  key={skill.id}
                >

                  <div className="skill-name">
                    <strong>{skill.name}</strong>
                  </div>

                  {editingSkillId === skill.id ? (
                    <div className="skill-edit">

                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingProficiency}
                        onChange={(event) =>
                          setEditingProficiency(
                            Number(event.target.value)
                          )
                        }
                      />

                      <button
                        type="button"
                        className="save-button"
                        onClick={() =>
                          saveProficiency(skill.id)
                        }
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="cancel-button"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>

                    </div>
                  ) : (
                    <div className="skill-actions">

                      <div className="proficiency">
                        <span>
                          {skill.proficiency}/5
                        </span>

                        <div className="proficiency-bar">
                          <div
                            style={{
                              width: `${skill.proficiency}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="proficiency-label">
                        {skill.proficiency}%
                      </span>

                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          startEditing(skill)
                        }
                      >
                        Edit
                      </button>

                    </div>
                  )}

                </div>
              ))
            )}

          </div>

        </section>

        </div>
      </div>
    </StudentPageLayout>
  );
}

export default StudentSkills;