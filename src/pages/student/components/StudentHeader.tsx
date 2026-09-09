import "./StudentHeader.css";

interface StudentHeaderProps {
  studentName: string;
  department: string;
  title?: string;
  placementStatus?: string;
  companyName?: string;
}

function StudentHeader({
  studentName,
  department,
  title = "Student Dashboard",
  placementStatus,
  companyName,
}: StudentHeaderProps) {
  const isPlaced = placementStatus === "Placed" || Boolean(companyName);

  return (
    <header className="student-header">
      <div className="student-header-brand">
        <div>
          <h2>{title}</h2>
          <p className="portal-subheading">Campus Placement Cell & Career Portal</p>
        </div>
      </div>

      <div className="student-header-user">
        {isPlaced && (
          <span className="badge-success header-placed-badge">
            ✓ Placed {companyName ? `@ ${companyName}` : ""}
          </span>
        )}

        <div className="student-header-avatar">
          {studentName ? studentName.charAt(0).toUpperCase() : "S"}
        </div>

        <div>
          <strong>{studentName}</strong>
          <span>{department}</span>
        </div>
      </div>
    </header>
  );
}

export default StudentHeader;