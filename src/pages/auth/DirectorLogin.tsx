import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllDrives, saveSession } from "../../api";
import "./DirectorLogin.css";

const REMEMBER_DIRECTOR_KEY = "hireon.remembered_director";

function DirectorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(REMEMBER_DIRECTOR_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const drives = await getAllDrives();
      const directors = drives
        .map((drive) => drive.director)
        .filter((director): director is NonNullable<typeof director> => Boolean(director));
      const directorMatch = directors.find(
        (director) => director.email.toLowerCase() === email.trim().toLowerCase() && director.password === password
      );

      if (!directorMatch) {
        setError("The email or password is incorrect.");
        return;
      }

      // Remember me handling
      if (rememberMe) {
        localStorage.setItem(REMEMBER_DIRECTOR_KEY, JSON.stringify({ email: email.trim(), password }));
      } else {
        localStorage.removeItem(REMEMBER_DIRECTOR_KEY);
      }

      const safeDirector = { ...directorMatch, password: undefined };
      saveSession({ role: "director", user: safeDirector });
      navigate("/director-dashboard");
    } catch {
      setError("Unable to connect to HireOn backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="director-login-page">
      <div className="director-brand">
        <div className="director-brand-content">
          <img
            src="/logo.png"
            alt="HireOn Portal"
            style={{ maxHeight: "64px", marginBottom: "20px", objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h2>
            Empowering Campus Recruitment & Placement Management.
          </h2>

          <p>
            Manage drive approvals, track student eligibility metrics, review placed student requests,
            and streamline campus recruitment.
          </p>

          <div className="director-features">
            <div>
              <span>✓</span>
              <p>Authority controls for placed student requests</p>
            </div>
            <div>
              <span>✓</span>
              <p>Eligibility score analytics & applicant directory</p>
            </div>
            <div>
              <span>✓</span>
              <p>Recruiting company portfolio & drive creation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="director-login-section">
        <div className="director-login-card">
          <div className="director-login-header">
            <h2>Director Sign In</h2>
            <p>Access your Placement Authority portal</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="director-form-group">
              <label htmlFor="director-email">Email Address</label>
              <input
                id="director-email"
                type="email"
                placeholder="director@college.edu"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="director-form-group">
              <label htmlFor="director-password">Password</label>
              <input
                id="director-password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="director-login-options" style={{ margin: "14px 0 6px" }}>
              <label className="director-remember-me" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#475569", fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
            </div>

            {error && <div className="alert-danger-box" role="alert">{error}</div>}
            {success && <div className="alert-success-box" role="status">{success}</div>}

            <button type="submit" className="director-login-button" disabled={isLoading} style={{ marginTop: "1rem" }}>
              {isLoading ? "Signing In..." : "Sign In to Director Portal"}
            </button>
          </form>

          <div className="director-login-footer">
            <div className="student-login">
              <span>Are you a student?</span>
              <button
                type="button"
                onClick={() => navigate("/login-page")}
                style={{ color: "#4F46E5", fontWeight: "700" }}
              >
                Student Portal →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectorLogin;