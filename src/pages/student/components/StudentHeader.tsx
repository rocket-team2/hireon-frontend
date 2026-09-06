import "./StudentHeader.css";

interface StudentHeaderProps {
  studentName: string;
  department: string;
  title?: string;
}

function StudentHeader({
  studentName,
  department,
  title = "Student Dashboard",
}: StudentHeaderProps) {
  return (
    <header className="student-header">
      <div>
        <h2>{title}</h2>
        <p>Placement Management System</p>
      </div>

      <div className="student-header-user">
        <div className="student-header-avatar">
          {studentName.charAt(0)}
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