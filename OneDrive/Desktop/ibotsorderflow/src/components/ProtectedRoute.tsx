import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";

type Props = {
  children: React.ReactElement;
  allowedRoles?: string[]; // if omitted -> any authenticated user
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}