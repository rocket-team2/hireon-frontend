import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDirector, getSession, updateDirector, type Director } from "../../api";
import DirectorPageLayout from "./components/DirectorPageLayout";
import "./DirectorProfile.css";

function DirectorProfile() {
  const navigate = useNavigate();
  const [director, setDirector] = useState<Director | null>(() => {
    const session = getSession();
    return session?.role === "director" ? session.user as Director : null;
  });
  const [name, setName] = useState(() => director?.name ?? "");
  const [email, setEmail] = useState(() => director?.email ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const directorId = director?.director_id;

  useEffect(() => {
    if (!directorId) {
      navigate("/director-login-page", { replace: true });
      return;
    }

    void getDirector(directorId)
      .then((freshDirector) => {
        setDirector(freshDirector);
        setName(freshDirector.name);
        setEmail(freshDirector.email);
      })
      .catch(() => setError("Unable to load your profile. Make sure the backend is running."));
  }, [directorId, navigate]);

  const saveProfile = async () => {
    if (!director) return;

    try {
      const updatedDirector = await updateDirector(director.director_id, {
        ...director,
        name: name.trim(),
        email: email.trim(),
      });
      setDirector(updatedDirector);
      localStorage.setItem("hireon.session", JSON.stringify({ role: "director", user: updatedDirector }));
      setIsEditing(false);
      setMessage("Profile updated.");
      setError("");
    } catch {
      setError("Unable to save your profile.");
    }
  };

  return (
    <DirectorPageLayout activePage="profile" title="My Profile">
      <div className="director-profile-page">
        <div className="director-profile-container">
          <div className="director-profile-header">
            <div>
              <h1>My Profile</h1>
              <p>View and update your placement director account details.</p>
            </div>
            <div className="profile-header-actions">
              <button type="button" onClick={() => navigate("/director-dashboard")}>Back to Dashboard</button>
              <button type="button" onClick={isEditing ? () => void saveProfile() : () => setIsEditing(true)}>
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>
            </div>
          </div>

          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}

          <section className="director-profile-card">
            <div className="director-profile-basic">
              <div className="director-profile-avatar">{name.charAt(0).toUpperCase()}</div>
              <div>
                <h2>{name || "Placement Director"}</h2>
                <p>Placement Director</p>
              </div>
            </div>

            <div className="director-profile-details">
              <label>
                <span>Name</span>
                {isEditing ? <input value={name} onChange={(event) => setName(event.target.value)} /> : <strong>{name}</strong>}
              </label>
              <label>
                <span>Email</span>
                {isEditing ? <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /> : <strong>{email}</strong>}
              </label>
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
