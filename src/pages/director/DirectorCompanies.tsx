import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { addCompany, getCompanies, type Company } from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorCompanies.css";

function DirectorCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cName, setCName] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getCompanies()
      .then((data) => setCompanies(data))
      .catch(() => setError("Unable to load companies from database."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;

    try {
      setIsSaving(true);
      setError("");
      setMessage("");
      const newCompany = await addCompany({
        c_name: cName.trim(),
        comp_url: compUrl.trim() || undefined,
      });
      setCompanies((prev) => [...prev, newCompany]);
      setCName("");
      setCompUrl("");
      setMessage("Company added successfully.");
    } catch {
      setError("Failed to add company. Check details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DirectorPageLayout activePage="companies" title="Companies Visited">
      <div className="director-companies-page">
        <div className="companies-header">
          <div>
            <h1>Companies Directory</h1>
            <p>Manage companies registered for campus placements.</p>
          </div>
        </div>

        {message && <p role="status" style={{ color: "#059669", marginBottom: "1rem" }}>{message}</p>}
        {error && <p role="alert" style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</p>}

        <div className="add-company-card">
          <h2>Add New Company</h2>
          <form className="add-company-form" onSubmit={(e) => void handleAddCompany(e)}>
            <div className="form-field">
              <label htmlFor="company-name">Company Name *</label>
              <input
                id="company-name"
                type="text"
                placeholder="e.g. Google, TCS, Infosys"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="company-url">Website URL</label>
              <input
                id="company-url"
                type="url"
                placeholder="https://company.com"
                value={compUrl}
                onChange={(e) => setCompUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="add-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Company"}
            </button>
          </form>
        </div>

        {isLoading ? (
          <p>Loading companies from database...</p>
        ) : (
          <div className="companies-grid-director">
            {companies.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No companies registered in database.</p>
            ) : (
              companies.map((c) => (
                <div key={c.comp_id} className="director-company-card">
                  <div>
                    <h3>{c.c_name}</h3>
                    {c.comp_url ? (
                      <a href={c.comp_url} target="_blank" rel="noreferrer">
                        {c.comp_url}
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>No URL</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorCompanies;
