import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./CreateDrive.css";

function CreateDrive() {
  const navigate = useNavigate();

  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [ctc, setCtc] = useState("");
  const [maxArrear, setMaxArrear] = useState("");
  const [targetBatch, setTargetBatch] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  const availableDepartments = [
    "IT",
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL",
  ];

  const handleDepartmentChange = (department: string) => {
    if (departments.includes(department)) {
      setDepartments(
        departments.filter((item) => item !== department)
      );
    } else {
      setDepartments([...departments, department]);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newDrive = {
      id: Date.now(),
      company,
      jobRole,
      ctc: Number(ctc),
      maxArrear: Number(maxArrear),
      targetBatch: Number(targetBatch),
      deadline,
      description,
      departments,
    };

    const existingDrives = localStorage.getItem("directorDrives");
    const drives = existingDrives ? JSON.parse(existingDrives) : [];
    drives.push(newDrive);
    localStorage.setItem("directorDrives", JSON.stringify(drives));

    navigate("/director-dashboard");
  };

  return (
    <DirectorPageLayout activePage="create-drive" title="Create Placement Drive">
      <div className="create-drive-page">
        <div className="create-drive-container">

        <div className="create-drive-header">
          <div>
            <h1>Create Placement Drive</h1>
            <p>
              Enter the details for the new placement drive.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/director-dashboard")}
          >
            Back
          </button>
        </div>

        <form
          className="create-drive-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section">
            <h2>Drive Details</h2>

            <div className="form-grid">

              <div className="form-group">
                <label htmlFor="company">
                  Company
                </label>

                <select
                  id="company"
                  value={company}
                  onChange={(event) =>
                    setCompany(event.target.value)
                  }
                  required
                >
                  <option value="">
                    Select company
                  </option>

                  <option value="TCS">TCS</option>
                  <option value="Infosys">Infosys</option>
                  <option value="Wipro">Wipro</option>
                  <option value="Accenture">
                    Accenture
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="job-role">
                  Job Role
                </label>

                <input
                  id="job-role"
                  type="text"
                  value={jobRole}
                  onChange={(event) =>
                    setJobRole(event.target.value)
                  }
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ctc">
                  CTC (LPA)
                </label>

                <input
                  id="ctc"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ctc}
                  onChange={(event) =>
                    setCtc(event.target.value)
                  }
                  placeholder="7.5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="max-arrear">
                  Maximum Arrears
                </label>

                <input
                  id="max-arrear"
                  type="number"
                  min="0"
                  value={maxArrear}
                  onChange={(event) =>
                    setMaxArrear(event.target.value)
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="target-batch">
                  Target Batch
                </label>

                <input
                  id="target-batch"
                  type="number"
                  value={targetBatch}
                  onChange={(event) =>
                    setTargetBatch(event.target.value)
                  }
                  placeholder="2027"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deadline">
                  Registration Deadline
                </label>

                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) =>
                    setDeadline(event.target.value)
                  }
                  required
                />
              </div>

            </div>
          </div>


          <div className="form-section">
            <h2>Eligible Departments</h2>

            <p className="form-description">
              Select the departments that can apply for this drive.
            </p>

            <div className="department-list">
              {availableDepartments.map((department) => (
                <label
                  key={department}
                  className="department-item"
                >
                  <input
                    type="checkbox"
                    checked={departments.includes(department)}
                    onChange={() =>
                      handleDepartmentChange(department)
                    }
                  />

                  <span>{department}</span>
                </label>
              ))}
            </div>
          </div>


          <div className="form-section">
            <h2>Drive Description</h2>

            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Enter the details of the placement drive..."
              />
            </div>
          </div>


          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/director-dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-button"
            >
              Create Drive
            </button>
          </div>

        </form>
        </div>
      </div>
    </DirectorPageLayout>
  );
}

export default CreateDrive;