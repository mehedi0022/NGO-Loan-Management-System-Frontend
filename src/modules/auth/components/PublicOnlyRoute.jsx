import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export function PublicOnlyRoute() {
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
