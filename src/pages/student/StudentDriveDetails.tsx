import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";

import {
  getDrive,
  registerForDrive,
  getStudentRegistrations,
  departmentsFromDrive,
  getRequiredSkills,
} from "../../api";

import type {
  Drive,
  Registration,
  RequiredSkill,
} from "../../api";

import "./StudentDriveDetails.css";


function StudentDriveDetails() {

  // =========================================================
  // 1. ROUTER
  // =========================================================

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  // =========================================================
  // 2. STATE
  // =========================================================

  const [drive, setDrive] = useState<Drive | null>(null);

  const [requiredSkills, setRequiredSkills] =
    useState<RequiredSkill[]>([]);

  const [loading, setLoading] = useState(true);

  const [registering, setRegistering] =
    useState(false);

  const [registered, setRegistered] =
    useState(false);

  const [error, setError] = useState("");


  // =========================================================
  // 3. STUDENT SESSION
  // =========================================================

  const session = JSON.parse(
    localStorage.getItem("hireon.session") || "null"
  );

  const studentId = session?.user?.sId;

  const studentName =
    session?.user?.name || "Student";

  const department =
    session?.user?.department || "";


  // =========================================================
  // 4. LOAD DRIVE WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    loadDrive();
  }, [id]);


  // =========================================================
  // 5. LOAD DRIVE DETAILS
  // =========================================================

  const loadDrive = async () => {

    if (!id) {
      return;
    }

    try {

      setLoading(true);
      setError("");

      const driveId = Number(id);


      // -------------------------------------------------------
      // Get drive details
      // -------------------------------------------------------

      const driveData = await getDrive(driveId);

      setDrive(driveData);


      // -------------------------------------------------------
      // Get required skills
      // -------------------------------------------------------

      try {

        const skills =
          await getRequiredSkills(driveId);

        setRequiredSkills(skills);

      } catch (error) {

        console.log(
          "Required skills not available",
          error
        );

      }


      // -------------------------------------------------------
      // Check registration
      // -------------------------------------------------------

      if (studentId) {

        try {

          const registrations =
            await getStudentRegistrations(studentId);

          const alreadyRegistered =
            registrations.some(
              (registration: Registration) =>
                registration.drive?.driveId === driveId
            );

          setRegistered(alreadyRegistered);

        } catch (error) {

          console.log(
            "Unable to check registration",
            error
          );

        }

      }

    } catch (error) {

      console.error(error);

      setError(
        "Unable to load placement drive details."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // 6. REGISTER FOR DRIVE
  // =========================================================

  const handleRegister = async () => {

    if (!drive || !studentId) {

      alert(
        "Student information not found."
      );

      return;
    }


    try {

      setRegistering(true);


      await registerForDrive(
        drive.driveId,
        studentId
      );


      setRegistered(true);


      alert(
        "Successfully registered for this placement drive!"
      );

    } catch (error: any) {

      console.error(error);

      alert(
        error?.message ||
        "Unable to register for this drive."
      );

    } finally {

      setRegistering(false);

    }
  };


  // =========================================================
  // 7. SIDEBAR NAVIGATION
  // =========================================================

  const handleNavigation = (page: string) => {

    switch (page) {

      case "dashboard":
        navigate("/student-dashboard");
        break;

      case "drives":
        navigate("/student/drives");
        break;

      case "applications":
        navigate("/student/applications");
        break;

      case "shortlisted":
        navigate("/student/shortlisted");
        break;

      case "skills":
        navigate("/student/skills");
        break;

      case "profile":
        navigate("/student-profile");
        break;

      default:
        break;
    }
  };


  // =========================================================
  // 8. LOGOUT
  // =========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "hireon.session"
    );

    localStorage.removeItem(
      "hireon.role"
    );

    navigate(
      "/login-page"
    );
  };


  // =========================================================
  // 9. LOADING PAGE
  // =========================================================

  if (loading) {

    return (

      <div className="student-dashboard">

        <StudentSidebar
          activePage="drives"
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />


        <div className="student-dashboard-main">

          <StudentHeader
            studentName={studentName}
            department={department}
          />


          <main className="student-drive-details">

            <div className="details-loading">

              Loading placement drive...

            </div>

          </main>

        </div>

      </div>
    );
  }


  // =========================================================
  // 10. ERROR / DRIVE NOT FOUND
  // =========================================================

  if (error || !drive) {

    return (

      <div className="student-dashboard">

        <StudentSidebar
          activePage="drives"
          onNavigate={handleNavigation}
          onLogout={handleLogout}
        />


        <div className="student-dashboard-main">

          <StudentHeader
            studentName={studentName}
            department={department}
          />


          <main className="student-drive-details">

            <div className="details-error">

              <h2>
                Drive Not Found
              </h2>


              <p>
                {error ||
                  "The placement drive could not be found."
                }
              </p>


              <button
                onClick={() =>
                  navigate("/student/drives")
                }
              >
                ← Back to Placement Drives
              </button>

            </div>

          </main>

        </div>

      </div>
    );
  }


  // =========================================================
  // 11. DRIVE DATA
  // =========================================================

  const departments =
    departmentsFromDrive(
      drive.allowed_dept
    );


  const deadline =
    new Date(drive.deadline);


  const isExpired =
    deadline.getTime() < Date.now();


  // =========================================================
  // 12. MAIN UI
  // =========================================================

  return (

    <div className="student-dashboard">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <StudentSidebar
        activePage="drives"
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="student-dashboard-main">


        {/* Header */}

        <StudentHeader
          studentName={studentName}
          department={department}
        />


        <main className="student-drive-details">


          {/* =================================================
              BACK BUTTON
          ================================================= */}

          <button
            className="details-back-button"
            onClick={() =>
              navigate("/student/drives")
            }
          >
            ← Back to Placement Drives
          </button>


          {/* =================================================
              DRIVE HEADER
          ================================================= */}

          <section className="drive-details-header">


            {/* Company + Role */}

            <div className="drive-details-title">

              <div className="company-avatar">

                {drive.company?.c_name
                  ?.charAt(0)
                  ?.toUpperCase()
                }

              </div>


              <div>

                <div className="details-small-label">
                  PLACEMENT DRIVE
                </div>


                <h1>
                  {drive.company?.c_name}
                </h1>


                <p>
                  {drive.job_role}
                </p>

              </div>

            </div>


            {/* Status */}

            <div
              className={
                isExpired
                  ? "drive-status closed"
                  : registered
                  ? "drive-status registered"
                  : "drive-status active"
              }
            >

              {isExpired
                ? "Closed"
                : registered
                ? "Registered"
                : "Active"
              }

            </div>

          </section>


          {/* =================================================
              JOB DETAILS
          ================================================= */}

          <section className="details-card">

            <div className="details-card-heading">

              <div>

                <h2>
                  Job Details
                </h2>


                <p>
                  Information about this placement opportunity
                </p>

              </div>

            </div>


            <div className="details-info-grid">


              {/* Company */}

              <div className="details-info-item">

                <span>
                  Company
                </span>

                <strong>
                  {drive.company?.c_name}
                </strong>

              </div>


              {/* Job Role */}

              <div className="details-info-item">

                <span>
                  Job Role
                </span>

                <strong>
                  {drive.job_role}
                </strong>

              </div>


              {/* Package */}

              <div className="details-info-item">

                <span>
                  Package
                </span>

                <strong>
                  ₹{drive.ctc_lpa} LPA
                </strong>

              </div>


              {/* Target Batch */}

              <div className="details-info-item">

                <span>
                  Target Batch
                </span>

                <strong>
                  {drive.target_cg_batch}
                </strong>

              </div>


              {/* Arrears */}

              <div className="details-info-item">

                <span>
                  Maximum Active Arrears
                </span>

                <strong>
                  {drive.max_arrear}
                </strong>

              </div>


              {/* Deadline */}

              <div className="details-info-item">

                <span>
                  Application Deadline
                </span>

                <strong>

                  {deadline.toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}

                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              ABOUT OPPORTUNITY
          ================================================= */}

          <section className="details-card">

            <h2>
              About the Opportunity
            </h2>


            <p className="details-description">

              {drive.description ||
                "No description has been provided for this placement opportunity."
              }

            </p>

          </section>


          {/* =================================================
              ELIGIBILITY
          ================================================= */}

          <section className="details-card">

            <h2>
              Eligibility
            </h2>


            <div className="eligibility-grid">


              <div className="eligibility-item">

                <span>
                  Eligible Batch
                </span>

                <strong>
                  {drive.target_cg_batch}
                </strong>

              </div>


              <div className="eligibility-item">

                <span>
                  Maximum Arrears
                </span>

                <strong>
                  {drive.max_arrear}
                </strong>

              </div>


              <div className="eligibility-item">

                <span>
                  Your Department
                </span>

                <strong>
                  {department || "Not Available"}
                </strong>

              </div>

            </div>


            {/* Eligible Departments */}

            {departments.length > 0 && (

              <div className="eligible-departments">

                <span>
                  Eligible Departments
                </span>


                <div className="department-tags">

                  {departments.map(
                    (dept, index) => (

                      <span
                        key={index}
                        className="department-tag"
                      >
                        {dept}
                      </span>

                    )
                  )}

                </div>

              </div>

            )}

          </section>


          {/* =================================================
              REQUIRED SKILLS
          ================================================= */}

          {requiredSkills.length > 0 && (

            <section className="details-card">

              <h2>
                Required Skills
              </h2>


              <p className="section-description">

                Skills expected for this placement opportunity.

              </p>


              <div className="required-skills">

                {requiredSkills.map(
                  (item) => (

                    <div
                      className="required-skill"
                      key={item.req_id}
                    >

                      <div>

                        <strong>
                          {item.skill?.skillName}
                        </strong>

                        <span>
                          Required proficiency
                        </span>

                      </div>


                      <div className="proficiency">

                        {item.reqProficiency}/5

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================================
              COMPANY INFORMATION
          ================================================= */}

          <section className="details-card">

            <h2>
              Company Information
            </h2>


            <div className="company-information">


              <div className="company-information-name">

                <div className="company-avatar small">

                  {drive.company?.c_name
                    ?.charAt(0)
                    ?.toUpperCase()
                  }

                </div>


                <div>

                  <strong>
                    {drive.company?.c_name}
                  </strong>

                  <span>
                    Recruiting through HireOn
                  </span>

                </div>

              </div>


              {drive.company?.comp_url && (

                <a
                  href={drive.company.comp_url}
                  target="_blank"
                  rel="noreferrer"
                  className="company-link"
                >
                  Visit Company Website →
                </a>

              )}

            </div>

          </section>


          {/* =================================================
              REGISTER SECTION
          ================================================= */}

          <section className="drive-application-card">


            <div>

              <h2>

                {registered
                  ? "You are registered"
                  : "Interested in this opportunity?"
                }

              </h2>


              <p>

                {registered

                  ? "You have successfully registered for this placement drive."

                  : isExpired

                  ? "The registration deadline for this drive has passed."

                  : `Apply before ${deadline.toLocaleDateString(
                      "en-IN"
                    )}.`
                }

              </p>

            </div>


            <button
              className="register-button"
              disabled={
                isExpired ||
                registered ||
                registering
              }
              onClick={handleRegister}
            >

              {registering
                ? "Registering..."
                : registered
                ? "✓ Registered"
                : isExpired
                ? "Applications Closed"
                : "Register for Drive"
              }

            </button>

          </section>


        </main>

      </div>

    </div>
  );
}


export default StudentDriveDetails;