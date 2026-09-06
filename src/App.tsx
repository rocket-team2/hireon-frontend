import { Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/auth/StudentLogin";
import DirectorLogin from "./pages/auth/DirectorLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import DirectorDashboard from "./pages/director/DirectorDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import DirectorProfile from "./pages/director/DirectorProfile";
import CreateDrive from "./pages/director/CreateDrive";
import StudentSkills from "./pages/student/StudentSkills";

function App() {
  return (
    <Routes>
      <Route path="/login-page" element={<StudentLogin />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/director-login-page" element={<DirectorLogin />} />
      <Route path="/director-dashboard" element={<DirectorDashboard />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/director-profile" element={<DirectorProfile />} />
      <Route path="/create-drive" element={<CreateDrive />} />
      <Route path="/student/skills" element={<StudentSkills />} />

      <Route
        path="*"
        element={<Navigate to="/login-page" replace />}
      />
    </Routes>
  );
}

export default App;