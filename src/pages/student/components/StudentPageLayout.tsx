import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, type Student } from "../../../api";
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
    switch (page) {
      case "dashboard":
        navigate("/student-dashboard");
        break;
      case "drives":
        navigate("/student/drives");
        break;
      case "applications":
        navigate("/student/applications");
        break;
      case "shortlisted":
        navigate("/student/shortlisted");
        break;
      case "skills":
        navigate("/student/skills");
        break;
      case "companies":
        navigate("/student/companies");
        break;
      case "profile":
        navigate("/student-profile");
        break;
      default:
        navigate("/student-dashboard");
        break;
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login-page", { replace: true });
  };

  const session = getSession();
  const student = session?.role === "student" ? session.user as Student : null;

  return (
    <div className="student-page-layout">
      <StudentSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />
      <div className="student-page-main">
        <StudentHeader studentName={student?.name ?? "Student"} department={student?.department ?? ""} title={title} />
        <div className="student-page-content">{children}</div>
      </div>
    </div>
  );
}

export default StudentPageLayout;
