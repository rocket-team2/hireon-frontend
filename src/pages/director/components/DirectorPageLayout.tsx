import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getSession, type Director } from "../../../api";
import DirectorHeader from "./DirectorHeader";
import DirectorSidebar from "./DirectorSidebar";
import "./PageLayout.css";

interface DirectorPageLayoutProps {
  activePage: string;
  title: string;
  children: ReactNode;
}

function DirectorPageLayout({ activePage, title, children }: DirectorPageLayoutProps) {
  const navigate = useNavigate();

  const handleNavigation = (page: string) => {
    switch (page) {
      case "dashboard":
        navigate("/director-dashboard");
        break;
      case "students":
        navigate("/director/students");
        break;
      case "companies":
        navigate("/director/companies");
        break;
      case "drives":
        navigate("/director/drives");
        break;
      case "create-drive":
        navigate("/create-drive");
        break;
      case "applications":
        navigate("/director/applications");
        break;
      case "rounds":
        navigate("/director/rounds");
        break;
      case "shortlists":
        navigate("/director/shortlists");
        break;
      case "profile":
        navigate("/director-profile");
        break;
      default:
        navigate("/director-dashboard");
        break;
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/director-login-page", { replace: true });
  };

  const session = getSession();
  const director = session?.role === "director" ? session.user as Director : null;

  return (
    <div className="director-page-layout">
      <DirectorSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />
      <div className="director-page-main">
        <DirectorHeader directorName={director?.name ?? "Placement Director"} title={title} />
        <div className="director-page-content">{children}</div>
      </div>
    </div>
  );
}

export default DirectorPageLayout;
