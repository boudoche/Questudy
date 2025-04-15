import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import QuestionPage from './pages/QuestionPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CoursePage from './pages/CoursePage';
import ProtectedRoute from './components/ProtectedRoute';
import ReactGA from "react-ga4";

ReactGA.initialize("G-B2KG6LFMQL");

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/course/:courseId" element={
                        <ProtectedRoute>
                            <CoursePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/upload" element={
                        <ProtectedRoute>
                            <UploadPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/questions" element={
                        <ProtectedRoute>
                            <QuestionPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/" element={<Navigate replace to="/login" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
