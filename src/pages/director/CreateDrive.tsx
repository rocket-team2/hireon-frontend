import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createDrive, getCompanies, getDrive, getSession, updateDrive, type Company, type Director, type Drive } from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./CreateDrive.css";

function CreateDrive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editDriveId = searchParams.get("driveId");
  const [director] = useState<Director | null>(() => {
    const session = getSession();
    return session?.role === "director" ? session.user as Director : null;
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [ctc, setCtc] = useState("");
  const [maxArrear, setMaxArrear] = useState("");
  const [targetBatch, setTargetBatch] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const availableDepartments = ["IT", "CSE", "ECE", "EEE", "MECH", "CIVIL"];

  const setFormFromDrive = (drive: Drive) => {
    setCompany(String(drive.company.comp_id));
    setJobRole(drive.job_role);
    setCtc(String(drive.ctc_lpa));
    setMaxArrear(String(drive.max_arrear));
    setTargetBatch(String(drive.target_cg_batch));
    setDeadline(drive.deadline.slice(0, 16));
    setDescription(drive.description ?? "");
    setDepartments(Array.isArray(drive.allowed_dept) ? drive.allowed_dept.filter((item): item is string => typeof item === "string") : []);
  };

  useEffect(() => {
    if (!director) {
      navigate("/director-login-page", { replace: true });
      return;
    }

    const companyRequest = getCompanies().then((items) => {
      setCompanies(items);
      return items;
    });
    const driveRequest = editDriveId ? getDrive(Number(editDriveId)) : Promise.resolve(null);

    void Promise.all([companyRequest, driveRequest])
      .then(([, drive]) => {
        if (drive) {
          setFormFromDrive(drive);
        }
      })
      .catch(() => setError("Unable to load companies. Make sure the backend is running."))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDepartmentChange = (department: string) => {
    setDepartments((currentDepartments) => currentDepartments.includes(department)
      ? currentDepartments.filter((item) => item !== department)
      : [...currentDepartments, department]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!director || !company) return;

    try {
      setIsSaving(true);
      setError("");
      const drivePayload = {
        company: { comp_id: Number(company), c_name: "" },
        director,
        job_role: jobRole,
        ctc_lpa: Number(ctc),
        max_arrear: Number(maxArrear),
        target_cg_batch: Number(targetBatch),
        deadline,
        description,
        allowed_dept: departments,
      };
      if (editDriveId) {
        await updateDrive(Number(editDriveId), drivePayload);
      } else {
        await createDrive(drivePayload);
      }
      navigate("/director-dashboard");
    } catch {
      setError("Unable to create this drive. Check the details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DirectorPageLayout activePage="create-drive" title="Create Placement Drive">
      <div className="create-drive-page">
        <div className="create-drive-container">
          <div className="create-drive-header">
            <div>
              <h1>{editDriveId ? "Edit Placement Drive" : "Create Placement Drive"}</h1>
              <p>Enter the details for the new placement drive.</p>
            </div>
            <button type="button" className="back-button" onClick={() => navigate("/director-dashboard")}>Back</button>
          </div>

          {error && <p role="alert">{error}</p>}

          <form className="create-drive-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="form-section">
              <h2>Drive Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <select id="company" value={company} onChange={(event) => setCompany(event.target.value)} required disabled={isLoading}>
                    <option value="">{isLoading ? "Loading companies..." : "Select company"}</option>
                    {companies.map((item) => <option key={item.comp_id} value={item.comp_id}>{item.c_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="job-role">Job Role</label>
                  <input id="job-role" type="text" value={jobRole} onChange={(event) => setJobRole(event.target.value)} placeholder="Software Engineer" required />
                </div>
                <div className="form-group">
                  <label htmlFor="ctc">CTC (LPA)</label>
                  <input id="ctc" type="number" min="0" step="0.01" value={ctc} onChange={(event) => setCtc(event.target.value)} placeholder="7.5" required />
                </div>
                <div className="form-group">
                  <label htmlFor="max-arrear">Maximum Arrears</label>
                  <input id="max-arrear" type="number" min="0" value={maxArrear} onChange={(event) => setMaxArrear(event.target.value)} placeholder="0" required />
                </div>
                <div className="form-group">
                  <label htmlFor="target-batch">Target Batch</label>
                  <input id="target-batch" type="number" value={targetBatch} onChange={(event) => setTargetBatch(event.target.value)} placeholder="2027" required />
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Registration Deadline</label>
                  <input id="deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Eligible Departments</h2>
              <p className="form-description">Select the departments that can apply for this drive.</p>
              <div className="department-list">
                {availableDepartments.map((department) => (
                  <label key={department} className="department-item">
                    <input type="checkbox" checked={departments.includes(department)} onChange={() => handleDepartmentChange(department)} />
                    <span>{department}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2>Drive Description</h2>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter the details of the placement drive..." />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => navigate("/director-dashboard")}>Cancel</button>
              <button type="submit" className="create-button" disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : editDriveId ? "Save Changes" : "Create Drive"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DirectorPageLayout>
  );
}

export default CreateDrive;
