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
      {/* LEFT BRAND PANEL */}
      <div className="director-brand">
        <div className="director-brand-content">
          <div className="brand-logo-circle">
            <img
              src="/logo.png"
              alt="HireOn Logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <h1 className="brand-title">HireOn</h1>

          <p className="brand-subtitle">
            To stay connected with us please login with your personal info
          </p>

          <button
            type="button"
            className="brand-signin-btn"
            onClick={() => {
              const emailInput = document.getElementById("director-email");
              emailInput?.focus();
            }}
          >
            SIGN IN
          </button>

          <div className="brand-tabs">
            <span className="brand-tab" onClick={() => navigate("/login-page")}>
              STUDENT HERE
            </span>
            <span className="tab-divider">|</span>
            <span className="brand-tab active" onClick={() => navigate("/director-login-page")}>
              DIRECTOR HERE
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="director-login-section">
        <div className="director-login-card">
          <div className="director-login-header">
            <h2>Welcome</h2>
            <p>Login in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="director-form-group">
              <input
                id="director-email"
                type="email"
                placeholder="Email..........."
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="director-form-group">
              <input
                id="director-password"
                type="password"
                placeholder="Password..........."
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="director-login-options">
              <label className="director-remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="director-forgot-password"
                onClick={() => setError("Please contact your IT administrator for Director credentials.")}
              >
                Forgot your password?
              </button>
            </div>

            {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
            {success && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>{success}</div>}

            <div className="login-btn-container">
              <button type="submit" className="director-login-button" disabled={isLoading}>
                {isLoading ? "LOGGING IN..." : "LOG IN"}
              </button>
            </div>
          </form>

          <div className="director-login-footer">
            <p>
              Don't have an account?{" "}
              <span className="signup-link" onClick={() => setError("Please contact institution administration for Director portal access.")}>
                sign up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectorLogin;