import { usePermission } from "../hooks/usePermission.js";

export function PermissionGuard({ permission, fallback = null, children }) {
  const allowed = usePermission(permission);
  return allowed ? children : fallback;
}
