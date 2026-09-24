import { useSelector } from "react-redux";

import { can } from "../permissions.js";

export function usePermission(permission) {
  const user = useSelector((state) => state.auth.user);
  return can(user, permission);
}
