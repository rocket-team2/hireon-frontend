import type { FormEvent } from "react";
import "./DirectorLogin.css";
import {useNavigate} from "react-router-dom";

function DirectorLogin() {
  const navigate = useNavigate();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("Director login submitted");
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

            <button
              type="submit"
              className="director-login-button"
            >
              Sign In
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