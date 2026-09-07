import { useEffect, useState } from "react";
import {
  getSession,
  getShortlistedByStudent,
  type ShortlistedStudent,
  type Student,
} from "../../api";
import StudentPageLayout from "./components/StudentPageLayout";
import "./StudentShortlisted.css";

function StudentShortlisted() {
  const [shortlists, setShortlists] = useState<ShortlistedStudent[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  useEffect(() => {
    if (!student) return;

    void getShortlistedByStudent(student.sId)
      .then((data) => setShortlists(data))
      .catch(() => setError("Unable to load shortlisted rounds from database."))
      .finally(() => setIsLoading(false));
  }, [student]);

  return (
    <StudentPageLayout activePage="shortlisted" title="Shortlisted Rounds">
      <div className="shortlisted-page">

        {error && <p className="profile-saved-message" role="alert">{error}</p>}

        {isLoading ? (
          <p>Loading shortlist records from database...</p>
        ) : shortlists.length === 0 ? (
          <div className="empty-shortlist">
            <p>You have not been shortlisted for any recruitment rounds yet.</p>
          </div>
        ) : (
          <div className="shortlist-list">
            {shortlists.map((item) => {
              const statusClass = String(item.status ?? "").toLowerCase();
              return (
                <div key={item.shortlistId} className="shortlist-card">
                  <div className="shortlist-info">
                    <h3>{item.round?.drive?.company?.c_name ?? "Company Drive"}</h3>
                    <p>
                      <strong>Round:</strong> {item.round?.roundName ?? "Round"} |{" "}
                      <strong>Role:</strong> {item.round?.drive?.job_role ?? "-"}
                    </p>
                    {item.round?.roundLink && (
                      <p>
                        <strong>Link:</strong>{" "}
                        <a href={item.round.roundLink} target="_blank" rel="noreferrer">
                          {item.round.roundLink}
                        </a>
                      </p>
                    )}
                    {item.feedbackUrl && (
                      <a
                        href={item.feedbackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="feedback-link"
                      >
                        View Feedback / Notes
                      </a>
                    )}
                  </div>

                  <div>
                    <span className={`shortlist-status-badge ${statusClass}`}>
                      {item.status || "Shortlisted"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentPageLayout>
  );
}

export default StudentShortlisted;
