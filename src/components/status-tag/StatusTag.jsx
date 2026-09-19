import { Tag } from "antd";

const statusColors = {
  active: "success",
  approved: "success",
  paid: "success",
  pending: "warning",
  overdue: "error",
  rejected: "error",
  inactive: "default",
};

export function StatusTag({ status, label }) {
  return (
    <Tag color={statusColors[status?.toLowerCase()] || "default"}>
      {label || status}
    </Tag>
  );
}
