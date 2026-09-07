import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDirector, saveSession } from "../../api";
import "./DirectorLogin.css";

function DirectorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let directorMatch;
      for (let id = 1; id <= 20 && !directorMatch; id += 1) {
        try {
          const director = await getDirector(id);
          if (director.email.toLowerCase() === email.trim().toLowerCase() && director.password === password) {
            directorMatch = director;
          }
        } catch {
          // The existing backend exposes directors by id, so missing ids are skipped.
        }
      }

      if (!directorMatch) {
        setError("The email or password is incorrect.");
        return;
      }

      const safeDirector = { ...directorMatch, password: undefined };
      saveSession({ role: "director", user: safeDirector });
      navigate("/director-dashboard");
    } catch {
      setError("Unable to connect to HireOn. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="director-login-page">

      {/* Left Section */}
      <div className="director-brand">
        <div className="director-brand-content">
          <h1>HireOn</h1>

          <h2>
            Empowering
            <br />
            Campus Careers.
          </h2>

          <p>
            Manage placement drives, connect students with companies,
            and streamline the entire campus recruitment process.
          </p>

          <div className="director-features">
            <div>
              <span>✓</span>
              <p>Create and manage placement drives</p>
            </div>

            <div>
              <span>✓</span>
              <p>Track student applications and progress</p>
            </div>

            <div>
              <span>✓</span>
              <p>Manage recruitment rounds and shortlists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="director-login-section">
        <div className="director-login-card">

          <div className="director-login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your placement director account</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="director-form-group">
              <label htmlFor="director-email">
                Email Address
              </label>

              <input
                id="director-email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="director-form-group">
              <label htmlFor="director-password">
                Password
              </label>

              <input
                id="director-password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="director-login-options">
              <label className="director-remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="director-forgot-password"
              >
                Forgot password?
              </button>
            </div>

            {error && <p className="director-login-message director-login-error" role="alert">{error}</p>}
            {success && <p className="director-login-message director-login-success" role="status">{success}</p>}

            <button
              type="submit"
              className="director-login-button"
              disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          <div className="director-login-footer">

            <div className="student-login">
              <span>Are you a student?</span>

              <button type="button"
              onClick={()=>navigate("/login-page")}>
                Student Login
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

export default DirectorLogin;