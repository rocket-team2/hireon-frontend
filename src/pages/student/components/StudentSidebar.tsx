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
      <div className="student-sidebar-logo">
        <div className="sidebar-logo-circle">
          <img
            src="/logo.png"
            alt="HireOn Logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <span className="sidebar-logo-text">HireOn</span>
      </div>

      <nav className="student-sidebar-menu">
        {menuItems.map((item) => (
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
          className={activePage === "profile" ? "student-sidebar-item active" : "student-sidebar-item"}
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