import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, saveSession } from "../../api";
import "./StudentLogin.css";

function StudentLogin() {
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
      const students = await getStudents();
      const student = students.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);

      if (!student) {
        setError("The email or password is incorrect.");
        return;
      }

      const safeStudent = { ...student, password: undefined };
      saveSession({ role: "student", user: safeStudent });
      navigate("/student-dashboard");
    } catch {
      setError("Unable to connect to HireOn. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-brand">
        <div className="brand-content">
          <h1>HireOn</h1>

          <h2>
            Your Career.
            <br />
            Your Opportunity.
          </h2>

          <p>
            Connect with top companies, discover placement opportunities,
            and take the next step toward your career.
          </p>

          <div className="brand-features">
            <div>
              <span>✓</span>
              <p>Discover placement opportunities</p>
            </div>

            <div>
              <span>✓</span>
              <p>Track your placement journey</p>
            </div>

            <div>
              <span>✓</span>
              <p>Connect with leading companies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-section">
        <div className="login-card">

          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your student account</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
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

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Forgot password?
              </button>
            </div>

            {error && <p className="login-message login-error" role="alert">{error}</p>}
            {success && <p className="login-message login-success" role="status">{success}</p>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          <div className="login-footer">
            <div className="director-login">
              <span>Are you a placement director?</span>
              <button type="button"
              onClick={()=>navigate("/director-login-page")}>Director Login</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default StudentLogin;