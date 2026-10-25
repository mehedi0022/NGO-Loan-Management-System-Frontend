import { Tag } from "antd";

import { formatEnum } from "../../loans/loanFormatters.js";

const colors = {
  SUPER_ADMIN: "purple",
  ADMIN: "blue",
  MANAGER: "cyan",
  FIELD_OFFICER: "green",
};

export function RoleTag({ role }) {
  return <Tag color={colors[role] || "default"}>{formatEnum(role)}</Tag>;
}
