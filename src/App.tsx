import { Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/auth/StudentLogin";
import DirectorLogin from "./pages/auth/DirectorLogin";

function App() {
  return (
    <Routes>
      <Route path="/login-page" element={<StudentLogin />} />
      <Route path="/director-login-page" element={<DirectorLogin />} />

      <Route
        path="*"
        element={<Navigate to="/login-page" replace />}
      />
    </Routes>
  );
}

export default App;