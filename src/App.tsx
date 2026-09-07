import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "./api";
import StudentLogin from "./pages/auth/StudentLogin";
import DirectorLogin from "./pages/auth/DirectorLogin";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentDrives from "./pages/student/StudentDrives";
import StudentApplications from "./pages/student/StudentApplications";
import StudentShortlisted from "./pages/student/StudentShortlisted";
import StudentSkills from "./pages/student/StudentSkills";
import StudentCompanies from "./pages/student/StudentCompanies";
import StudentProfile from "./pages/student/StudentProfile";

import DirectorDashboard from "./pages/director/DirectorDashboard";
import DirectorStudents from "./pages/director/DirectorStudents";
import DirectorCompanies from "./pages/director/DirectorCompanies";
import DirectorDrives from "./pages/director/DirectorDrives";
import CreateDrive from "./pages/director/CreateDrive";
import DirectorApplications from "./pages/director/DirectorApplications";
import DirectorRounds from "./pages/director/DirectorRounds";
import DirectorShortlists from "./pages/director/DirectorShortlists";
import DirectorProfile from "./pages/director/DirectorProfile";

function ProtectedRoute({ role, children }: { role: "student" | "director"; children: ReactNode }) {
  const session = getSession();

  if (!session || session.role !== role) {
    return <Navigate to={role === "student" ? "/login-page" : "/director-login-page"} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login-page" element={<StudentLogin />} />
      <Route path="/director-login-page" element={<DirectorLogin />} />

      {/* Student Routes */}
      <Route path="/student-dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/drives" element={<ProtectedRoute role="student"><StudentDrives /></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute role="student"><StudentApplications /></ProtectedRoute>} />
      <Route path="/student/shortlisted" element={<ProtectedRoute role="student"><StudentShortlisted /></ProtectedRoute>} />
      <Route path="/student/skills" element={<ProtectedRoute role="student"><StudentSkills /></ProtectedRoute>} />
      <Route path="/student/companies" element={<ProtectedRoute role="student"><StudentCompanies /></ProtectedRoute>} />
      <Route path="/student-profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

      {/* Director Routes */}
      <Route path="/director-dashboard" element={<ProtectedRoute role="director"><DirectorDashboard /></ProtectedRoute>} />
      <Route path="/director/students" element={<ProtectedRoute role="director"><DirectorStudents /></ProtectedRoute>} />
      <Route path="/director/companies" element={<ProtectedRoute role="director"><DirectorCompanies /></ProtectedRoute>} />
      <Route path="/director/drives" element={<ProtectedRoute role="director"><DirectorDrives /></ProtectedRoute>} />
      <Route path="/create-drive" element={<ProtectedRoute role="director"><CreateDrive /></ProtectedRoute>} />
      <Route path="/director/applications" element={<ProtectedRoute role="director"><DirectorApplications /></ProtectedRoute>} />
      <Route path="/director/rounds" element={<ProtectedRoute role="director"><DirectorRounds /></ProtectedRoute>} />
      <Route path="/director/shortlists" element={<ProtectedRoute role="director"><DirectorShortlists /></ProtectedRoute>} />
      <Route path="/director-profile" element={<ProtectedRoute role="director"><DirectorProfile /></ProtectedRoute>} />

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/login-page" replace />} />
    </Routes>
  );
}

export default App;