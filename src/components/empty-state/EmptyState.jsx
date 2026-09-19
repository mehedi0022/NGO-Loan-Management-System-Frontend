import { Empty } from "antd";

export function EmptyState({ description = "No records found." }) {
  return <Empty description={description} />;
}
