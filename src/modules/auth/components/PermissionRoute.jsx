import { Result } from "antd";

import { usePermission } from "../hooks/usePermission.js";

export function PermissionRoute({ permission, children }) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle="You do not have permission to view this page."
      />
    );
  }

  return children;
}
