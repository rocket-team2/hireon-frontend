import type { FormEvent } from "react";
import "./StudentLogin.css";
import {useNavigate} from "react-router-dom";

function StudentLogin() {
  const navigate = useNavigate();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("Student login submitted");
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
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

            <button type="submit" className="login-button">
              Sign In
            </button>

          </form>

          <div className="login-footer">
            <p>
              Don't have an account?
              <button type="button">Create account</button>
            </p>

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