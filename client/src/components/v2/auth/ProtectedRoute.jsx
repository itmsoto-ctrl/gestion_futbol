import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Aquí es donde el login debería guardar el pase

  if (!token) {
    // Si no hay token, ¡fuera! Al login.
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;