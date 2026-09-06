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
      <div className="director-header-title">
        <h2>{title}</h2>
        <p>Placement Management System</p>
      </div>

      <div className="director-header-user">
        <div className="director-header-avatar">
          {directorName.charAt(0).toUpperCase()}
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