import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
    if (page === "profile") {
      navigate("/director-profile");
      return;
    }

    if (page === "create-drive") {
      navigate("/create-drive");
      return;
    }

    if (page === "dashboard") {
      navigate("/director-dashboard");
      return;
    }

    navigate("/director-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("hireon.role");
    navigate("/director-login-page", { replace: true });
  };

  return (
    <div className="director-page-layout">
      <DirectorSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />
      <div className="director-page-main">
        <DirectorHeader directorName="Placement Director" title={title} />
        <div className="director-page-content">{children}</div>
      </div>
    </div>
  );
}

export default DirectorPageLayout;
