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
      <div className="login-brand">
        <div className="brand-content">
          <img
            src="/logo.png"
            alt="HireOn Portal"
            style={{ maxHeight: "64px", marginBottom: "20px", objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <h2>
            Connect. Analyze. Achieve.
            <br />
            Your Career Portal.
          </h2>

          <p>
            Connect with top companies, discover recruitment drives, track eligibility metrics,
            and achieve your dream placement.
          </p>

          <div className="brand-features">
            <div>
              <span>✓</span>
              <p>Dynamic eligibility scoring</p>
            </div>
            <div>
              <span>✓</span>
              <p>Instant application tracking & email reports</p>
            </div>
            <div>
              <span>✓</span>
              <p>Top recruiting partner companies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Student Sign In</h2>
            <p>Access your student placement dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="student@college.edu"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {/* Remember Me Checkbox (No Forgot Password) */}
            <div className="login-options" style={{ margin: "14px 0 6px" }}>
              <label className="remember-me" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#475569", fontSize: "0.9rem" }}>
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

            <button type="submit" className="login-button" disabled={isLoading} style={{ marginTop: "1rem" }}>
              {isLoading ? "Signing In..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="login-footer">
            <div className="director-login">
              <span>Are you a placement director?</span>
              <button
                type="button"
                onClick={() => navigate("/director-login-page")}
                style={{ color: "#4F46E5", fontWeight: "700" }}
              >
                Director Portal →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;