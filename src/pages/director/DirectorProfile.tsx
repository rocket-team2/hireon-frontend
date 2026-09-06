import { useNavigate } from "react-router-dom";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorProfile.css";

interface Director {
  name: string;
  email: string;
}

const director: Director = {
  name: "Placement Director",
  email: "director@example.com",
};

function DirectorProfile() {
  const navigate = useNavigate();

  return (
    <DirectorPageLayout activePage="profile" title="My Profile">
      <div className="director-profile-page">
        <div className="director-profile-container">

        <div className="director-profile-header">
          <div>
            <h1>My Profile</h1>
            <p>View your placement director account details.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/director-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        <section className="director-profile-card">

          <div className="director-profile-basic">
            <div className="director-profile-avatar">
              {director.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2>{director.name}</h2>
              <p>Placement Director</p>
            </div>
          </div>

          <div className="director-profile-details">
            <div>
              <span>Name</span>
              <strong>{director.name}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{director.email}</strong>
            </div>

            <div>
              <span>Role</span>
              <strong>Placement Director</strong>
            </div>
          </div>

        </section>

        </div>
      </div>
    </DirectorPageLayout>
  );
}

export default DirectorProfile;