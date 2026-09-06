import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import StudentHeader from "./StudentHeader";
import StudentSidebar from "./StudentSidebar";
import "./PageLayout.css";

interface StudentPageLayoutProps {
  activePage: string;
  title: string;
  children: ReactNode;
}

function StudentPageLayout({ activePage, title, children }: StudentPageLayoutProps) {
  const navigate = useNavigate();

  const handleNavigation = (page: string) => {
    if (page === "profile") {
      navigate("/student-profile");
      return;
    }

    if (page === "dashboard") {
      navigate("/student-dashboard");
      return;
    }

    navigate("/student-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("hireon.role");
    navigate("/login-page", { replace: true });
  };

  return (
    <div className="student-page-layout">
      <StudentSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />
      <div className="student-page-main">
        <StudentHeader studentName="Thejashree" department="Information Technology" title={title} />
        <div className="student-page-content">{children}</div>
      </div>
    </div>
  );
}

export default StudentPageLayout;
