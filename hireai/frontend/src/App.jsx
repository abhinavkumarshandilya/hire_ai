import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout          from "./components/Layout";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Dashboard       from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import InterviewDetail from "./pages/InterviewDetail";
import InterviewRoom   from "./pages/InterviewRoom";
import Results         from "./pages/Results";
import Pricing         from "./pages/Pricing";

const Private = ({ children }) => { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace />; };
const Public  = ({ children }) => { const { user } = useAuth(); return !user ? children : <Navigate to="/dashboard" replace />; };

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "Inter,sans-serif", fontSize: "13px", borderRadius: "10px" }, duration: 3500 }} />
        <Routes>
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/login"     element={<Public><Login /></Public>} />
          <Route path="/register"  element={<Public><Register /></Public>} />
          <Route path="/interview/:token" element={<InterviewRoom />} />
          <Route element={<Private><Layout /></Private>}>
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/create"             element={<CreateInterview />} />
            <Route path="/interviews/:id"     element={<InterviewDetail />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/pricing"            element={<Pricing />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
