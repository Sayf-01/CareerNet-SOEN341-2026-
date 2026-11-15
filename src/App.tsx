
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";

import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";
import RecruiterJobPage from "./pages/RecruiterJobPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* DA-1 and DA-2: Job Listing, Search, and Filters */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />

          {/* DA-3: Job Detail */}
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetailPage />
              </ProtectedRoute>
            }
          />

          {/* DA-4: My Applications */}
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />

          {/* KR-4: Recruiter Dashboard */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute requiredRole="RECRUITER">
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/recruiter/jobs/:id"
  element={
    <ProtectedRoute requiredRole="RECRUITER">
      <RecruiterJobPage />
    </ProtectedRoute>
  }
/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
