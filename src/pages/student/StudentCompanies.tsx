import { useEffect, useState } from "react";
import { getCompanies, type Company } from "../../api";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentCompanies.css";

function StudentCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getCompanies()
      .then((data) => setCompanies(data))
      .catch(() => setError("Unable to load visiting companies from database."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <StudentPageLayout activePage="companies" title="Companies Visited">
      <div className="student-companies-page">
        <div className="student-companies-header">
          <h1>Companies Visited</h1>
          <p>Browse all partner companies participating in campus recruitment.</p>
        </div>

        {error && <p className="profile-saved-message" role="alert">{error}</p>}

        {isLoading ? (
          <p>Loading companies from database...</p>
        ) : (
          <div className="companies-grid">
            {companies.length === 0 ? (
              <div className="empty-companies">
                <p>No companies found in database.</p>
              </div>
            ) : (
              companies.map((company) => (
                <div key={company.comp_id} className="company-card">
                  <h3>{company.c_name}</h3>
                  {company.comp_url ? (
                    <a href={company.comp_url} target="_blank" rel="noreferrer">
                      Visit Company Site
                    </a>
                  ) : (
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No website specified</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </StudentPageLayout>
  );
}

export default StudentCompanies;
