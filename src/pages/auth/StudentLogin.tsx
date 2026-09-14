import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, saveSession } from "../../api";
import "./StudentLogin.css";

const REMEMBER_STUDENT_KEY = "hireon.remembered_student";

function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(REMEMBER_STUDENT_KEY);
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
      const students = await getStudents();
      const student = students.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password
      );

      if (!student) {
        setError("The email or password is incorrect.");
        return;
      }

      // Remember me handling
      if (rememberMe) {
        localStorage.setItem(REMEMBER_STUDENT_KEY, JSON.stringify({ email: email.trim(), password }));
      } else {
        localStorage.removeItem(REMEMBER_STUDENT_KEY);
      }

      const safeStudent = { ...student, password: undefined };
      saveSession({ role: "student", user: safeStudent });
      navigate("/student-dashboard");
    } catch {
      setError("Unable to connect to HireOn backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT BRAND PANEL */}
      <div className="login-brand">
        <div className="brand-content">
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
              const emailInput = document.getElementById("email");
              emailInput?.focus();
            }}
          >
            SIGN IN
          </button>

          <div className="brand-tabs">
            <span className="brand-tab active" onClick={() => navigate("/login-page")}>
              STUDENT HERE
            </span>
            <span className="tab-divider">|</span>
            <span className="brand-tab" onClick={() => navigate("/director-login-page")}>
              DIRECTOR HERE
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome</h2>
            <p>Login in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="email"
                type="email"
                placeholder="Email..........."
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="form-group">
              <input
                id="password"
                type="password"
                placeholder="Password..........."
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => setError("Please contact your placement cell administrator to reset your password.")}
              >
                Forgot your password?
              </button>
            </div>

            {error && <div className="alert-danger-box" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
            {success && <div className="alert-success-box" role="status" style={{ marginBottom: "1rem" }}>{success}</div>}

            <div className="login-btn-container">
              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? "LOGGING IN..." : "LOG IN"}
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <span className="signup-link" onClick={() => setError("Please register through your college placement coordinator.")}>
                sign up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;