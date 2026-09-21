import { Tag } from "antd";

const statusColors = {
  active: "success",
  approved: "success",
  completed: "success",
  paid: "success",
  upcoming: "processing",
  pending: "warning",
  overdue: "error",
  rejected: "error",
  cancelled: "default",
  inactive: "default",
};

export function StatusTag({ status, label }) {
  return (
    <Tag color={statusColors[status?.toLowerCase()] || "default"}>
      {label || status}
    </Tag>
  );
}
