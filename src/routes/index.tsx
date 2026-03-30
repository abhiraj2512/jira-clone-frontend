import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ProjectPage from '../pages/Project/ProjectPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects/:id" element={<ProjectPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
