import { useNavigate } from "react-router-dom";
import "./StudentSidebar.css";

interface StudentSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

function StudentSidebar({
  activePage,
  onNavigate,
  onLogout,
}: StudentSidebarProps) {
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "drives", label: "Placement Drives" },
    { id: "applications", label: "My Applications" },
    { id: "shortlisted", label: "Shortlisted Rounds" },
    { id: "skills", label: "My Skills" },
    { id: "companies", label: "Companies Visited" },
  ];

  return (
    <aside className="student-sidebar">
      <div className="student-sidebar-logo">HireOn</div>

      <nav className="student-sidebar-menu">
        {menuItems.map((item) => item.id === "skills" ? (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "student-sidebar-item active" : "student-sidebar-item"}
            onClick={() => navigate("/student/skills")}
          >
            {item.label}
          </button>
        ) : (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "student-sidebar-item active" : "student-sidebar-item"}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="student-sidebar-bottom">
        <button
          type="button"
          className="student-sidebar-item"
          onClick={() => onNavigate("profile")}
        >
          My Profile
        </button>

        <button
          type="button"
          className="student-sidebar-item logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;