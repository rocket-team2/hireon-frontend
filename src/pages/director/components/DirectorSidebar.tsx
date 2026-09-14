import "./DirectorSidebar.css";

interface DirectorSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

function DirectorSidebar({
  activePage,
  onNavigate,
  onLogout,
}: DirectorSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "students", label: "Students" },
    { id: "companies", label: "Companies Visited" },
    { id: "drives", label: "Placement Drives" },
    { id: "create-drive", label: "Create Drive" },
    { id: "applications", label: "Applications" },
    { id: "rounds", label: "Recruitment Rounds" },
    { id: "shortlists", label: "Shortlists" },
  ];

  return (
    <aside className="director-sidebar">
      <div className="director-sidebar-logo">
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

      <nav className="director-sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activePage === item.id ? "director-sidebar-item active" : "director-sidebar-item"}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="director-sidebar-bottom">
        <button
          type="button"
          className={activePage === "profile" ? "director-sidebar-item active" : "director-sidebar-item"}
          onClick={() => onNavigate("profile")}
        >
          My Profile
        </button>

        <button type="button" className="director-sidebar-item logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default DirectorSidebar;
