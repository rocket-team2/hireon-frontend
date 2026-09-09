import "./DirectorHeader.css";

interface DirectorHeaderProps {
  directorName: string;
  title?: string;
}

function DirectorHeader({
  directorName,
  title = "Director Dashboard",
}: DirectorHeaderProps) {
  return (
    <header className="director-header">
      <div className="director-header-brand">
        <div>
          <h2>{title}</h2>
          <p className="portal-subheading">Placement Authority & Management Panel</p>
        </div>
      </div>

      <div className="director-header-user">
        <div className="director-header-avatar">
          {directorName ? directorName.charAt(0).toUpperCase() : "D"}
        </div>

        <div>
          <strong>{directorName}</strong>
          <span>Placement Director</span>
        </div>
      </div>
    </header>
  );
}

export default DirectorHeader;