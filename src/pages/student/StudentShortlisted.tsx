import { useEffect, useState } from "react";
import {
  getSession,
  getShortlistedByStudent,
  getAllDrives,
  getStudentId,
  type ShortlistedStudent,
  type Student,
  type Drive,
} from "../../api";
import StudentPageLayout from "./components/StudentPageLayout";
import CompanyLogo from "../../components/CompanyLogo";
import "./StudentShortlisted.css";

function StudentShortlisted() {
  const [shortlists, setShortlists] = useState<ShortlistedStudent[]>([]);
  const [drivesMap, setDrivesMap] = useState<Record<number, Drive>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [student] = useState<Student | null>(() => {
    const session = getSession();
    return session?.role === "student" ? (session.user as Student) : null;
  });

  useEffect(() => {
    const sId = getStudentId(student);
    if (!sId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      getShortlistedByStudent(sId).catch(() => []),
      getAllDrives().catch(() => []),
    ])
      .then(([shortlistData, drivesData]) => {
        setShortlists(shortlistData);
        const map: Record<number, Drive> = {};
        (drivesData || []).forEach((d) => {
          if (d && d.driveId) {
            map[d.driveId] = d;
          }
        });
        setDrivesMap(map);
      })
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
              
              // Resolve drive entity from round object or drivesMap lookup
              const roundObj = item.round || {};
              const drive = roundObj.drive || ((roundObj as unknown as { driveId?: number }).driveId ? drivesMap[(roundObj as unknown as { driveId: number }).driveId] : null);
              
              const companyName = drive?.company?.c_name || "Company";
              const companyUrl = drive?.company?.comp_url;
              const jobRole = drive?.job_role || "Role Not Specified";
              const roundName = roundObj.roundName || "Recruitment Round";

              return (
                <div key={item.shortlistId} className="shortlist-card">
                  <div className="shortlist-card-header">
                    <CompanyLogo companyName={companyName} companyUrl={companyUrl} size={48} />
                    <div className="shortlist-info">
                      <h3>{companyName}</h3>
                      <p className="shortlist-role-text">
                        <strong>Role:</strong> {jobRole}
                      </p>
                      <p className="shortlist-round-text">
                        <strong>Round:</strong> {roundName}
                      </p>
                      {roundObj.roundLink && (
                        <p className="shortlist-link-text">
                          <strong>Link:</strong>{" "}
                          <a href={roundObj.roundLink} target="_blank" rel="noreferrer">
                            {roundObj.roundLink}
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
