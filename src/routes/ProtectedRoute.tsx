import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/common/PageLoader';

const ProtectedRoute: React.FC = () => {
    const { token, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
